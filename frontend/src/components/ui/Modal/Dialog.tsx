import React from "react";
import { Modal } from "./Modal";
import { Button } from "../Button/Button";
import { AlertTriangle, HelpCircle } from "lucide-react";
import { cn } from "../../../utils/cn";

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "info",
  isLoading = false,
}) => {
  const iconMap = {
    danger: <AlertTriangle className="h-6 w-6 text-danger" />,
    warning: <AlertTriangle className="h-6 w-6 text-warning" />,
    info: <HelpCircle className="h-6 w-6 text-info" />,
  };

  const ringColors = {
    danger: "border-danger/20",
    warning: "border-warning/20",
    info: "border-info/20",
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" showCloseButton={false}>
      <div className="flex flex-col items-center text-center p-2 font-sans select-none">
        {/* Warning Icon Badge */}
        <div
          className={cn(
            "p-3 rounded-full border mb-4 bg-glass animate-[pulse_3s_infinite]",
            ringColors[variant]
          )}
        >
          {iconMap[variant]}
        </div>

        {/* Title */}
        <h3 className="text-heading-lg font-semibold tracking-tight text-text-primary mb-2">
          {title}
        </h3>

        {/* Description */}
        <p className="text-body-md text-text-muted mb-6 leading-relaxed">
          {description}
        </p>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 w-full">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === "danger" ? "danger" : "primary"}
            className="flex-1"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default Dialog;
