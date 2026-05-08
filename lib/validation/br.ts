/** Remove tudo que não for dígito. */
export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '')
}

/** Valida dígitos verificadores do CPF (11 dígitos). */
export function isValidCpf(cpf: string): boolean {
  const d = digitsOnly(cpf)
  if (d.length !== 11) return false
  if (/^(\d)\1{10}$/.test(d)) return false

  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(d[i]!, 10) * (10 - i)
  let mod = (sum * 10) % 11
  if (mod === 10 || mod === 11) mod = 0
  if (mod !== parseInt(d[9]!, 10)) return false

  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(d[i]!, 10) * (11 - i)
  mod = (sum * 10) % 11
  if (mod === 10 || mod === 11) mod = 0
  return mod === parseInt(d[10]!, 10)
}

/** Máscara visual 000.000.000-00 (máx. 11 dígitos). */
export function formatCpfDisplay(digits: string): string {
  const d = digitsOnly(digits).slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}

function isValidBrazilNationalPhone(nat: string): boolean {
  const d = digitsOnly(nat)
  if (d.length !== 10 && d.length !== 11) return false
  const ddd = parseInt(d.slice(0, 2), 10)
  if (Number.isNaN(ddd) || ddd < 11 || ddd > 99) return false
  if (d.length === 11 && d[2] !== '9') return false
  return true
}

/** Monta E.164 a partir do código do país (só dígitos) e número nacional (só dígitos). */
export function buildE164(dialCode: string, nationalDigits: string): string {
  const code = digitsOnly(dialCode)
  const nat = digitsOnly(nationalDigits)
  if (!code || !nat) return ''
  return `+${code}${nat}`
}

export function isValidPhoneNational(dialCode: string, nationalDigits: string): boolean {
  const code = digitsOnly(dialCode)
  const nat = digitsOnly(nationalDigits)
  if (!nat) return false
  if (code === '55') return isValidBrazilNationalPhone(nat)
  return nat.length >= 6 && nat.length <= 14
}
