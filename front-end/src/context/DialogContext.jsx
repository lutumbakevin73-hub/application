import { createContext, useCallback, useContext, useMemo, useState } from "react";
import ModalOverlay from "../components/ui/ModalOverlay";

const DialogContext = createContext(null);

let dialogId = 0;

function nextDialogId() {
  dialogId += 1;
  return `app-dialog-${dialogId}`;
}

export function DialogProvider({ children }) {
  const [dialog, setDialog] = useState(null);

  const closeDialog = useCallback((result) => {
    setDialog((current) => {
      current?.resolve(result);
      return null;
    });
  }, []);

  const confirm = useCallback((options = {}) => {
    const message = typeof options === "string" ? options : options.message;

    return new Promise((resolve) => {
      setDialog({
        id: nextDialogId(),
        type: "confirm",
        title: options.title || "Confirmation",
        message,
        confirmLabel: options.confirmLabel || "Confirmer",
        cancelLabel: options.cancelLabel || "Annuler",
        variant: options.variant || "default",
        resolve
      });
    });
  }, []);

  const alert = useCallback((options = {}) => {
    const message = typeof options === "string" ? options : options.message;

    return new Promise((resolve) => {
      setDialog({
        id: nextDialogId(),
        type: "alert",
        title: options.title || "Information",
        message,
        confirmLabel: options.confirmLabel || "OK",
        variant: options.variant || "default",
        resolve
      });
    });
  }, []);

  const value = useMemo(() => ({ confirm, alert }), [confirm, alert]);

  const confirmButtonClass =
    dialog?.variant === "danger"
      ? "rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
      : "btn-primary w-full sm:w-auto";

  return (
    <DialogContext.Provider value={value}>
      {children}

      {dialog && (
        <ModalOverlay
          labelledBy={dialog.id}
          onClose={() => closeDialog(dialog.type === "confirm" ? false : undefined)}
        >
          <div className="text-center sm:text-left">
            <h2 id={dialog.id} className="text-lg font-bold text-udbl-dark">
              {dialog.title}
            </h2>
            {dialog.message && (
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-udbl-muted">
                {dialog.message}
              </p>
            )}
          </div>

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            {dialog.type === "confirm" && (
              <button
                type="button"
                onClick={() => closeDialog(false)}
                className="btn-outline w-full sm:w-auto"
              >
                {dialog.cancelLabel}
              </button>
            )}
            <button
              type="button"
              onClick={() => closeDialog(dialog.type === "confirm" ? true : undefined)}
              className={confirmButtonClass}
            >
              {dialog.confirmLabel}
            </button>
          </div>
        </ModalOverlay>
      )}
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error("useDialog doit être utilisé dans DialogProvider");
  }
  return context;
}
