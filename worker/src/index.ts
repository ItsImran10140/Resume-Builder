import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Worker } from "bullmq";
import Redis from "ioredis";

const QUEUE_NAME = "pdf-export";

type PdfExportJobData = {
  resumeId: string;
  userId: string;
  latexSource: string;
  outputKey: string;
};

function getRedis() {
  const url = process.env.REDIS_URL;
  if (!url) throw new Error("REDIS_URL is required");
  return new Redis(url, { maxRetriesPerRequest: null });
}

function getR2Client() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("R2 credentials are required");
  }
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

async function compileLatexToPdf(latexSource: string): Promise<Buffer> {
  const tectonic = process.env.TECTONIC_BIN ?? "tectonic";
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "resume-export-"));
  const texPath = path.join(tmpDir, "resume.tex");
  const pdfPath = path.join(tmpDir, "resume.pdf");

  await fs.writeFile(texPath, latexSource, "utf8");

  await new Promise<void>((resolve, reject) => {
    const proc = spawn(tectonic, ["-o", tmpDir, texPath], { stdio: "inherit" });
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Tectonic exited with code ${code}`));
    });
  });

  const pdf = await fs.readFile(pdfPath);
  await fs.rm(tmpDir, { recursive: true, force: true });
  return pdf;
}

async function uploadPdf(key: string, pdf: Buffer) {
  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket) throw new Error("R2_BUCKET_NAME is required");

  const client = getR2Client();
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: pdf,
      ContentType: "application/pdf",
    }),
  );
}

const connection = getRedis();

const worker = new Worker<PdfExportJobData>(
  QUEUE_NAME,
  async (job) => {
    const { latexSource, outputKey } = job.data;
    console.log(`[pdf-export] job ${job.id} -> ${outputKey}`);

    const pdf = await compileLatexToPdf(latexSource);
    await uploadPdf(outputKey, pdf);

    return { outputKey, bytes: pdf.length };
  },
  { connection },
);

worker.on("completed", (job) => {
  console.log(`[pdf-export] completed ${job.id}`);
});

worker.on("failed", (job, err) => {
  console.error(`[pdf-export] failed ${job?.id}:`, err);
});

console.log(`Worker listening on queue: ${QUEUE_NAME}`);
