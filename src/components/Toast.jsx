import React, { createContext, useContext, useState } from "react";

const ToastContext = createContext();

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 px-6 py-3 rounded-lg shadow-lg text-base font-medium transition-all duration-300
            ${toast.type === "success" ? "bg-blue-500 text-white" : "bg-gray-800 text-white"}
          `}
        >
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  );
}
