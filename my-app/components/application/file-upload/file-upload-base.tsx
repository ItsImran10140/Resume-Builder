"use client";

import React, { useRef } from "react";

export const getReadableFileSize = (bytes: number) => {
  if (!bytes) return "0 KB";
  const thresh = 1024;
  if (Math.abs(bytes) < thresh) return bytes + " B";
  const units = ["KB", "MB", "GB", "TB"];
  let u = -1;
  do {
    bytes /= thresh;
    ++u;
  } while (Math.abs(bytes) >= thresh && u < units.length - 1);
  return bytes.toFixed(0) + " " + units[u];
};

type DropZoneProps = {
  className?: string;
  hint?: string;
  isDisabled?: boolean;
  accept?: string;
  allowsMultiple?: boolean;
  onDropFiles?: (files: FileList) => void;
};

export const FileUploadDropZone = ({
  className,
  hint,
  isDisabled,
  accept,
  allowsMultiple = true,
  onDropFiles,
}: DropZoneProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files || !onDropFiles) return;
    onDropFiles(files);
  };

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={accept}
        multiple={allowsMultiple}
        disabled={isDisabled}
        onChange={(e) => handleFiles(e.target.files)}
      />

      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (isDisabled) return;
          handleFiles(e.dataTransfer.files);
        }}
        className="cursor-pointer rounded-md border border-dashed p-6 text-center"
      >
        <div className="font-medium">Click to upload or drag and drop</div>
        <div className="text-xs text-muted">{hint || "SVG, PNG, JPG or GIF"}</div>
      </div>
    </div>
  );
};

export type UploadedFile = {
  id: string;
  name: string;
  size: number;
  type?: string;
  progress?: number;
  failed?: boolean;
};

type ListItemProps = UploadedFile & {
  onDelete?: () => void;
  onRetry?: () => void;
};

export const FileListItemProgressBar = ({ name, size, progress = 0, failed, onDelete, onRetry }: ListItemProps) => {
  return (
    <li className="flex items-center justify-between gap-3 rounded-md border p-3">
      <div className="min-w-0">
        <div className="truncate font-medium">{name}</div>
        <div className="text-xs text-muted">{getReadableFileSize(size)}</div>
      </div>

      <div className="flex items-center gap-2">
        {!failed && <div className="text-sm">{progress}%</div>}
        {failed && <div className="text-sm text-red-600">Failed</div>}
        {onRetry && failed && (
          <button onClick={onRetry} className="text-sm text-blue-600">Try again</button>
        )}
        {onDelete && (
          <button onClick={onDelete} className="text-sm text-red-600">Delete</button>
        )}
      </div>
    </li>
  );
};

export const FileListItemProgressFill = FileListItemProgressBar;

export const FileUploadRoot = ({ children, className }: React.ComponentPropsWithoutRef<"div">) => (
  <div className={className}>{children}</div>
);

export const FileUploadList = ({ children, className }: React.ComponentPropsWithoutRef<"ul">) => (
  <ul className={className}>{children}</ul>
);

export const FileUpload = {
  Root: FileUploadRoot,
  List: FileUploadList,
  DropZone: FileUploadDropZone,
  ListItemProgressBar: FileListItemProgressBar,
  ListItemProgressFill: FileListItemProgressFill,
};

export default FileUpload;
