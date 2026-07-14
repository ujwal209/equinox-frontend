import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface PolicyModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export default function PolicyModal({ isOpen, onClose, title, children }: PolicyModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl max-h-[80vh] flex flex-col p-6 sm:p-8 rounded-[2rem] border border-[var(--line)] bg-[var(--surface-strong)] text-[var(--sea-ink)] shadow-[0_24px_48px_rgba(0,0,0,0.4)]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[var(--sea-ink)] pr-10">{title}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 text-xs sm:text-sm text-[var(--sea-ink-soft)] leading-relaxed space-y-4 font-normal mt-4">
          {children}
        </div>

        <DialogFooter className="mt-6 pt-4 border-t border-[var(--line)] flex justify-end">
          <DialogClose asChild>
            <Button
              type="button"
              onClick={onClose}
              className="rounded-full bg-[var(--sea-ink)] hover:opacity-90 text-[var(--bg-base)] font-bold text-xs px-6 py-2.5 transition cursor-pointer"
            >
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

