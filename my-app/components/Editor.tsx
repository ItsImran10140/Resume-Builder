'use client'

import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor'

type EditorProps = {
  initialContent?: string
  onUpdate?: (html: string) => void
}

export default function Editor({ initialContent, onUpdate }: EditorProps) {
  return <SimpleEditor initialContent={initialContent} onUpdate={onUpdate} />
}
