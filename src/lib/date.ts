export function getWIBDate() {
  const now = new Date();

  return new Date(
    now.toLocaleString("en-US", {
      timeZone: "Asia/Jakarta",
    })
  );
}