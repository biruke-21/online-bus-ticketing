"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

type VerificationResult = {
  success: boolean;
  valid: boolean;
  alreadyBoarded?: boolean;
  message: string;
  ticket?: {
    ticketNumber: string;
    bookingReference: string;
    passengerName?: string;
    busName?: string;
    plateNumber?: string;
    origin?: string;
    destination?: string;
    departureTime?: string;
    paymentStatus?: string;
    bookingStatus?: string;
    totalAmount?: string;
    boarded?: boolean;
    boardedAt?: string | null;
    seats?: {
      seatNumber: string | number;
    }[];
  };
};

type ResultType = "valid" | "already-boarded" | "denied" | "invalid";

function getResultType(result: VerificationResult): ResultType {
  if (result.alreadyBoarded) {
    return "already-boarded";
  }

  if (result.valid) {
    return "valid";
  }

  const message = result.message.toLowerCase();

  if (
    message.includes("boarding denied") ||
    message.includes("not confirmed")
  ) {
    return "denied";
  }

  return "invalid";
}

const resultStyles: Record<
  ResultType,
  {
    title: string;
    icon: string;
    color: string;
    border: string;
    background: string;
  }
> = {
  valid: {
    title: "VALID TICKET",
    icon: "✓",
    color: "text-emerald-400",
    border: "border-emerald-500/40",
    background: "bg-emerald-500/10",
  },
  "already-boarded": {
    title: "ALREADY BOARDED",
    icon: "↻",
    color: "text-amber-400",
    border: "border-amber-500/40",
    background: "bg-amber-500/10",
  },
  denied: {
    title: "BOARDING DENIED",
    icon: "!",
    color: "text-orange-400",
    border: "border-orange-500/40",
    background: "bg-orange-500/10",
  },
  invalid: {
    title: "INVALID TICKET",
    icon: "✕",
    color: "text-red-400",
    border: "border-red-500/40",
    background: "bg-red-500/10",
  },
};

export default function ScanTicketPage() {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const processingRef = useRef(false);
  const mountedRef = useRef(false);

  const [cameraActive, setCameraActive] = useState(false);
  const [startingCamera, setStartingCamera] = useState(false);

  const [message, setMessage] = useState(
    "Start the camera and scan a passenger's QR ticket.",
  );

  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      const scanner = scannerRef.current;

      if (scanner?.isScanning) {
        void scanner.stop().catch(() => {
          // The camera may already have stopped.
        });
      }
    };
  }, []);

  async function startScanner() {
    if (startingCamera || cameraActive) {
      return;
    }

    setError("");
    setResult(null);
    setMessage("Starting camera...");
    setStartingCamera(true);
    processingRef.current = false;

    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode("busgo-qr-reader");
      }

      const scanner = scannerRef.current;

      if (scanner.isScanning) {
        setCameraActive(true);
        setMessage("Camera active. Point it at the passenger's QR code.");
        return;
      }

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        async (decodedText) => {
          if (processingRef.current) {
            return;
          }

          processingRef.current = true;

          setMessage("QR code detected. Verifying ticket...");
          setError("");

          try {
            let qrData: {
              ticketNumber?: unknown;
              bookingReference?: unknown;
            };

            try {
              qrData = JSON.parse(decodedText);
            } catch {
              throw new Error(
                "This QR code is not in the expected BusGo ticket format.",
              );
            }

            if (
              typeof qrData.ticketNumber !== "string" ||
              typeof qrData.bookingReference !== "string" ||
              !qrData.ticketNumber.trim() ||
              !qrData.bookingReference.trim()
            ) {
              throw new Error(
                "This QR code does not contain a valid BusGo ticket.",
              );
            }

            // Stop the camera while the ticket is being verified.
            if (scanner.isScanning) {
              await scanner.stop();
            }

            if (!mountedRef.current) {
              return;
            }

            setCameraActive(false);

            const response = await fetch("/api/verify-ticket", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                ticketNumber: qrData.ticketNumber,
                bookingReference: qrData.bookingReference,
              }),
            });

            const data: VerificationResult = await response.json();

            if (!mountedRef.current) {
              return;
            }

            if (!response.ok || !data.success) {
              setResult(null);
              setError(
                data.message || "Unable to verify the ticket. Please try again.",
              );
              setMessage("Verification failed.");
              return;
            }

            setResult(data);
            setMessage("Ticket verification complete.");
          } catch (err) {
            if (!mountedRef.current) {
              return;
            }

            setResult(null);

            setError(
              err instanceof Error
                ? err.message
                : "Unable to scan or verify this ticket.",
            );

            setMessage("Could not verify the scanned QR code.");
          } finally {
            processingRef.current = false;
          }
        },
        () => {
          // No QR code detected in this frame.
        },
      );

      if (!mountedRef.current) {
        if (scanner.isScanning) {
          await scanner.stop().catch(() => {});
        }

        return;
      }

      setCameraActive(true);
      setMessage("Camera active. Point it at the passenger's QR code.");
    } catch (err) {
      if (!mountedRef.current) {
        return;
      }

      setCameraActive(false);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to start the camera. Check camera permissions.",
      );

      setMessage("Camera could not start.");
    } finally {
      if (mountedRef.current) {
        setStartingCamera(false);
      }
    }
  }

  async function stopScanner() {
    const scanner = scannerRef.current;

    try {
      if (scanner?.isScanning) {
        await scanner.stop();
      }

      setCameraActive(false);
      setMessage("Camera stopped. You can scan another ticket.");
    } catch {
      setError("The camera could not be stopped cleanly.");
    }
  }

  async function scanAnotherTicket() {
    setResult(null);
    setError("");
    setMessage("Preparing to scan another passenger...");
    processingRef.current = false;

    await startScanner();
  }

  function formatDate(value?: string | null) {
    if (!value) {
      return "Not available";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  const resultType = result ? getResultType(result) : null;
  const style = resultType ? resultStyles[resultType] : null;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-4xl">
        {/* Page header */}
        <header className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/15 text-3xl">
            📷
          </div>

          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-blue-400">
            BusGo Staff Portal
          </p>

          <h1 className="text-3xl font-bold sm:text-4xl">
            QR Ticket Scanner
          </h1>

          <p className="mt-3 text-slate-400">
            Scan and verify passenger tickets before boarding.
          </p>
        </header>

        {/* Camera scanner */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-2xl sm:p-7">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Camera Scanner</h2>

            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                cameraActive
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "bg-slate-800 text-slate-400"
              }`}
            >
              {cameraActive ? "CAMERA ACTIVE" : "CAMERA STOPPED"}
            </span>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-700 bg-black p-2">
            <div id="busgo-qr-reader" className="w-full" />
          </div>

          <p className="mt-4 text-center text-sm text-slate-400">
            {message}
          </p>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={startScanner}
              disabled={startingCamera || cameraActive}
              className="flex-1 rounded-xl bg-blue-600 px-5 py-3 font-semibold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {startingCamera
                ? "Starting Camera..."
                : cameraActive
                  ? "Camera Running"
                  : "Start Camera"}
            </button>

            <button
              type="button"
              onClick={stopScanner}
              disabled={!cameraActive}
              className="flex-1 rounded-xl border border-slate-700 px-5 py-3 font-semibold transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Stop Camera
            </button>
          </div>

          {error && (
            <div
              role="alert"
              className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300"
            >
              <strong className="block">Scanner Notice</strong>
              <p className="mt-1 break-words">{error}</p>
            </div>
          )}
        </section>

        {/* Verification result */}
        {result && style && (
          <section
            aria-live="polite"
            className={`mt-6 overflow-hidden rounded-2xl border ${style.border}`}
          >
            <div className={`flex items-start gap-4 p-5 sm:p-6 ${style.background}`}>
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/5 text-2xl font-bold ${style.color}`}
              >
                {style.icon}
              </div>

              <div>
                <h2 className={`text-2xl font-bold ${style.color}`}>
                  {style.title}
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {result.message}
                </p>
              </div>
            </div>

            {result.ticket && (
              <div className="space-y-5 p-5 sm:p-6">
                <h3 className="font-semibold">
                  Passenger and Trip Details
                </h3>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Detail
                    label="Passenger"
                    value={result.ticket.passengerName}
                  />

                  <Detail
                    label="Ticket Number"
                    value={result.ticket.ticketNumber}
                  />

                  <Detail
                    label="Booking Reference"
                    value={result.ticket.bookingReference}
                  />

                  <Detail label="Bus" value={result.ticket.busName} />

                  <Detail
                    label="Plate Number"
                    value={result.ticket.plateNumber}
                  />

                  <Detail
                    label="Route"
                    value={
                      result.ticket.origin && result.ticket.destination
                        ? `${result.ticket.origin} → ${result.ticket.destination}`
                        : undefined
                    }
                  />

                  <Detail
                    label="Departure"
                    value={formatDate(result.ticket.departureTime)}
                  />

                  <Detail
                    label="Seat Number(s)"
                    value={
                      result.ticket.seats?.length
                        ? result.ticket.seats
                            .map((seat) => seat.seatNumber)
                            .join(", ")
                        : undefined
                    }
                  />

                  <Detail
                    label="Payment Status"
                    value={result.ticket.paymentStatus}
                  />

                  <Detail
                    label="Booking Status"
                    value={result.ticket.bookingStatus}
                  />

                  <Detail
                    label="Total Amount"
                    value={
                      result.ticket.totalAmount !== undefined
                        ? `${result.ticket.totalAmount} ETB`
                        : undefined
                    }
                  />

                  <Detail
                    label="Boarding Status"
                    value={
                      resultType === "valid"
                        ? "Approved"
                        : resultType === "already-boarded"
                          ? "Already boarded"
                          : result.ticket.boarded
                            ? "Already boarded"
                            : "Not approved"
                    }
                  />

                  {result.ticket.boardedAt && (
                    <Detail
                      label="Boarded At"
                      value={formatDate(result.ticket.boardedAt)}
                    />
                  )}
                </div>

                {resultType === "valid" && (
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-center font-semibold text-emerald-300">
                    ✓ Passenger is approved for boarding.
                  </div>
                )}

                {resultType === "already-boarded" && (
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-center font-semibold text-amber-300">
                    ⚠ This ticket has already been used. Do not approve
                    boarding again.
                  </div>
                )}

                {resultType === "denied" && (
                  <div className="rounded-xl border border-orange-500/20 bg-orange-500/10 p-4 text-center font-semibold text-orange-300">
                    Boarding is not permitted. Check the payment and booking
                    status.
                  </div>
                )}

                {resultType === "invalid" && (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-center font-semibold text-red-300">
                    Ticket verification failed. Do not approve boarding.
                  </div>
                )}
              </div>
            )}

            <div className="border-t border-slate-800 p-5">
              <button
                type="button"
                onClick={scanAnotherTicket}
                disabled={startingCamera}
                className="w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {startingCamera
                  ? "Starting Camera..."
                  : "Scan Another Ticket"}
              </button>
            </div>
          </section>
        )}

        <footer className="mt-8 text-center text-xs text-slate-500">
          BusGo Ticket Management System
        </footer>
      </div>
    </main>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value?: string;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-2 break-words text-sm font-semibold text-slate-200">
        {value || "Not available"}
      </p>
    </div>
  );
}