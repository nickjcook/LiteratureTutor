import { Copy } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { Button } from "@/components/ui/button"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        // Error toasts get a copy button so the full message can be pasted
        // into a bug report instead of retyped from a screenshot.
        const isError = props.variant === "destructive"
        const copyText = [title, description]
          .filter(Boolean)
          .map(String)
          .join(" — ")
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
              {isError && copyText && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-1.5 h-7 w-fit gap-1.5 border-destructive-foreground/40 bg-transparent px-2 text-xs text-destructive-foreground hover:bg-destructive-foreground/10"
                  onClick={() => navigator.clipboard.writeText(copyText)}
                  data-testid="button-copy-toast"
                >
                  <Copy className="h-3 w-3" aria-hidden /> Copy error
                </Button>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
