export function getWIBNow() {
    return new Date(
        new Date().toLocaleString("en-US", {
            timeZone: "Asia/Jakarta",
        })
    );
}

export function getTanggalWIB() {
    const now = getWIBNow();

    return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
}

export function getJamWIB() {
    const now = getWIBNow();

    return `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}:${String(now.getSeconds()).padStart(2,"0")}`;
}

export function getWIBDate() {
    return getWIBNow();
}
