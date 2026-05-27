import { Queue } from "bullmq";
import { getRedis } from "@/lib/redis";

export const PDF_EXPORT_QUEUE = "pdf-export";

let pdfExportQueue: Queue | null = null;

export function getPdfExportQueue(): Queue {
  if (!pdfExportQueue) {
    pdfExportQueue = new Queue(PDF_EXPORT_QUEUE, {
      connection: getRedis(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 200,
      },
    });
  }
  return pdfExportQueue;
}

export type PdfExportJobData = {
  resumeId: string;
  userId: string;
  latexSource: string;
  outputKey: string;
};
