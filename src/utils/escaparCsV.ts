export const escaparCSV = (val: string | number | boolean): string => {
    let str = String(val)
    // Normalizar caracteres Unicode (opcional)
    str = str.normalize('NFC')

    // Escapar comillas y comas
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`
    }
    return str
}