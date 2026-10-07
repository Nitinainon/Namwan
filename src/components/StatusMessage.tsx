export function StatusMessage({
  message,
  error = false,
}: {
  message: string;
  error?: boolean;
}) {
  return message ? (
    <p
      className={`status ${error ? "error" : "success"}`}
      role={error ? "alert" : "status"}
    >
      {message}
    </p>
  ) : null;
}
