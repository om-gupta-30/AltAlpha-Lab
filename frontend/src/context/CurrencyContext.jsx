import { createContext, useContext, useState, useEffect, useCallback } from 'react'

// Comprehensive list of world currencies with symbols, country codes for flags, and exchange rates (USD base)
// Rates are approximate and should be updated via API for production
const CURRENCIES = {
  // Major Currencies
  USD: { symbol: '$', name: 'US Dollar', rate: 1, country: 'us' },
  EUR: { symbol: 'E', name: 'Euro', rate: 0.92, country: 'eu' },
  GBP: { symbol: 'L', name: 'British Pound', rate: 0.79, country: 'gb' },
  JPY: { symbol: 'Y', name: 'Japanese Yen', rate: 149.50, country: 'jp' },
  CNY: { symbol: 'Y', name: 'Chinese Yuan', rate: 7.24, country: 'cn' },
  INR: { symbol: 'R', name: 'Indian Rupee', rate: 83.12, country: 'in' },
  
  // Other Major
  AUD: { symbol: 'A$', name: 'Australian Dollar', rate: 1.53, country: 'au' },
  CAD: { symbol: 'C$', name: 'Canadian Dollar', rate: 1.36, country: 'ca' },
  CHF: { symbol: 'Fr', name: 'Swiss Franc', rate: 0.88, country: 'ch' },
  HKD: { symbol: 'HK$', name: 'Hong Kong Dollar', rate: 7.82, country: 'hk' },
  SGD: { symbol: 'S$', name: 'Singapore Dollar', rate: 1.34, country: 'sg' },
  NZD: { symbol: 'NZ$', name: 'New Zealand Dollar', rate: 1.64, country: 'nz' },
  
  // European
  SEK: { symbol: 'kr', name: 'Swedish Krona', rate: 10.42, country: 'se' },
  NOK: { symbol: 'kr', name: 'Norwegian Krone', rate: 10.68, country: 'no' },
  DKK: { symbol: 'kr', name: 'Danish Krone', rate: 6.87, country: 'dk' },
  PLN: { symbol: 'zl', name: 'Polish Zloty', rate: 3.96, country: 'pl' },
  CZK: { symbol: 'Kc', name: 'Czech Koruna', rate: 23.21, country: 'cz' },
  HUF: { symbol: 'Ft', name: 'Hungarian Forint', rate: 361.50, country: 'hu' },
  RON: { symbol: 'lei', name: 'Romanian Leu', rate: 4.57, country: 'ro' },
  BGN: { symbol: 'lv', name: 'Bulgarian Lev', rate: 1.80, country: 'bg' },
  HRK: { symbol: 'kn', name: 'Croatian Kuna', rate: 6.93, country: 'hr' },
  RSD: { symbol: 'din', name: 'Serbian Dinar', rate: 107.85, country: 'rs' },
  ISK: { symbol: 'kr', name: 'Icelandic Krona', rate: 137.20, country: 'is' },
  RUB: { symbol: 'R', name: 'Russian Ruble', rate: 92.50, country: 'ru' },
  UAH: { symbol: 'H', name: 'Ukrainian Hryvnia', rate: 37.50, country: 'ua' },
  
  // Asia Pacific
  KRW: { symbol: 'W', name: 'South Korean Won', rate: 1325.00, country: 'kr' },
  TWD: { symbol: 'NT$', name: 'Taiwan Dollar', rate: 31.50, country: 'tw' },
  THB: { symbol: 'B', name: 'Thai Baht', rate: 35.50, country: 'th' },
  MYR: { symbol: 'RM', name: 'Malaysian Ringgit', rate: 4.72, country: 'my' },
  IDR: { symbol: 'Rp', name: 'Indonesian Rupiah', rate: 15750.00, country: 'id' },
  PHP: { symbol: 'P', name: 'Philippine Peso', rate: 55.80, country: 'ph' },
  VND: { symbol: 'D', name: 'Vietnamese Dong', rate: 24500.00, country: 'vn' },
  BDT: { symbol: 'Tk', name: 'Bangladeshi Taka', rate: 110.00, country: 'bd' },
  PKR: { symbol: 'Rs', name: 'Pakistani Rupee', rate: 278.50, country: 'pk' },
  LKR: { symbol: 'Rs', name: 'Sri Lankan Rupee', rate: 312.00, country: 'lk' },
  NPR: { symbol: 'Rs', name: 'Nepalese Rupee', rate: 133.00, country: 'np' },
  MMK: { symbol: 'K', name: 'Myanmar Kyat', rate: 2100.00, country: 'mm' },
  KHR: { symbol: 'R', name: 'Cambodian Riel', rate: 4100.00, country: 'kh' },
  LAK: { symbol: 'K', name: 'Lao Kip', rate: 20500.00, country: 'la' },
  BND: { symbol: 'B$', name: 'Brunei Dollar', rate: 1.34, country: 'bn' },
  MNT: { symbol: 'T', name: 'Mongolian Tugrik', rate: 3450.00, country: 'mn' },
  
  // Middle East
  AED: { symbol: 'Dh', name: 'UAE Dirham', rate: 3.67, country: 'ae' },
  SAR: { symbol: 'SR', name: 'Saudi Riyal', rate: 3.75, country: 'sa' },
  QAR: { symbol: 'QR', name: 'Qatari Riyal', rate: 3.64, country: 'qa' },
  KWD: { symbol: 'KD', name: 'Kuwaiti Dinar', rate: 0.31, country: 'kw' },
  BHD: { symbol: 'BD', name: 'Bahraini Dinar', rate: 0.38, country: 'bh' },
  OMR: { symbol: 'OR', name: 'Omani Rial', rate: 0.38, country: 'om' },
  JOD: { symbol: 'JD', name: 'Jordanian Dinar', rate: 0.71, country: 'jo' },
  LBP: { symbol: 'LL', name: 'Lebanese Pound', rate: 89500.00, country: 'lb' },
  ILS: { symbol: 'S', name: 'Israeli Shekel', rate: 3.67, country: 'il' },
  TRY: { symbol: 'TL', name: 'Turkish Lira', rate: 32.10, country: 'tr' },
  IRR: { symbol: 'IR', name: 'Iranian Rial', rate: 42000.00, country: 'ir' },
  IQD: { symbol: 'ID', name: 'Iraqi Dinar', rate: 1310.00, country: 'iq' },
  SYP: { symbol: 'SP', name: 'Syrian Pound', rate: 13000.00, country: 'sy' },
  YER: { symbol: 'YR', name: 'Yemeni Rial', rate: 250.00, country: 'ye' },
  
  // Africa
  ZAR: { symbol: 'R', name: 'South African Rand', rate: 18.75, country: 'za' },
  EGP: { symbol: 'EP', name: 'Egyptian Pound', rate: 30.90, country: 'eg' },
  NGN: { symbol: 'N', name: 'Nigerian Naira', rate: 1550.00, country: 'ng' },
  KES: { symbol: 'KSh', name: 'Kenyan Shilling', rate: 153.00, country: 'ke' },
  GHS: { symbol: 'GHC', name: 'Ghanaian Cedi', rate: 12.50, country: 'gh' },
  MAD: { symbol: 'DH', name: 'Moroccan Dirham', rate: 10.05, country: 'ma' },
  TND: { symbol: 'DT', name: 'Tunisian Dinar', rate: 3.11, country: 'tn' },
  DZD: { symbol: 'DA', name: 'Algerian Dinar', rate: 134.50, country: 'dz' },
  ETB: { symbol: 'Br', name: 'Ethiopian Birr', rate: 56.50, country: 'et' },
  TZS: { symbol: 'TSh', name: 'Tanzanian Shilling', rate: 2510.00, country: 'tz' },
  UGX: { symbol: 'USh', name: 'Ugandan Shilling', rate: 3780.00, country: 'ug' },
  RWF: { symbol: 'FRw', name: 'Rwandan Franc', rate: 1250.00, country: 'rw' },
  ZMW: { symbol: 'ZK', name: 'Zambian Kwacha', rate: 26.50, country: 'zm' },
  BWP: { symbol: 'P', name: 'Botswana Pula', rate: 13.60, country: 'bw' },
  MUR: { symbol: 'Rs', name: 'Mauritian Rupee', rate: 45.50, country: 'mu' },
  XOF: { symbol: 'CFA', name: 'West African CFA Franc', rate: 603.50, country: 'sn' },
  XAF: { symbol: 'FCFA', name: 'Central African CFA Franc', rate: 603.50, country: 'cm' },
  AOA: { symbol: 'Kz', name: 'Angolan Kwanza', rate: 830.00, country: 'ao' },
  MZN: { symbol: 'MT', name: 'Mozambican Metical', rate: 63.80, country: 'mz' },
  NAD: { symbol: 'N$', name: 'Namibian Dollar', rate: 18.75, country: 'na' },
  
  // Americas
  MXN: { symbol: 'MX$', name: 'Mexican Peso', rate: 17.15, country: 'mx' },
  BRL: { symbol: 'R$', name: 'Brazilian Real', rate: 4.97, country: 'br' },
  ARS: { symbol: 'AR$', name: 'Argentine Peso', rate: 870.00, country: 'ar' },
  CLP: { symbol: 'CL$', name: 'Chilean Peso', rate: 935.00, country: 'cl' },
  COP: { symbol: 'CO$', name: 'Colombian Peso', rate: 3950.00, country: 'co' },
  PEN: { symbol: 'S/', name: 'Peruvian Sol', rate: 3.72, country: 'pe' },
  UYU: { symbol: '$U', name: 'Uruguayan Peso', rate: 39.20, country: 'uy' },
  PYG: { symbol: 'Gs', name: 'Paraguayan Guarani', rate: 7350.00, country: 'py' },
  BOB: { symbol: 'Bs', name: 'Bolivian Boliviano', rate: 6.91, country: 'bo' },
  VES: { symbol: 'Bs', name: 'Venezuelan Bolivar', rate: 36.50, country: 've' },
  DOP: { symbol: 'RD$', name: 'Dominican Peso', rate: 58.50, country: 'do' },
  GTQ: { symbol: 'Q', name: 'Guatemalan Quetzal', rate: 7.82, country: 'gt' },
  CRC: { symbol: 'C', name: 'Costa Rican Colon', rate: 520.00, country: 'cr' },
  PAB: { symbol: 'B/', name: 'Panamanian Balboa', rate: 1.00, country: 'pa' },
  HNL: { symbol: 'L', name: 'Honduran Lempira', rate: 24.70, country: 'hn' },
  NIO: { symbol: 'C$', name: 'Nicaraguan Cordoba', rate: 36.70, country: 'ni' },
  JMD: { symbol: 'J$', name: 'Jamaican Dollar', rate: 155.50, country: 'jm' },
  TTD: { symbol: 'TT$', name: 'Trinidad Dollar', rate: 6.78, country: 'tt' },
  BBD: { symbol: 'Bds$', name: 'Barbadian Dollar', rate: 2.00, country: 'bb' },
  BSD: { symbol: 'B$', name: 'Bahamian Dollar', rate: 1.00, country: 'bs' },
  BZD: { symbol: 'BZ$', name: 'Belize Dollar', rate: 2.02, country: 'bz' },
  HTG: { symbol: 'G', name: 'Haitian Gourde', rate: 132.50, country: 'ht' },
  CUP: { symbol: 'CP', name: 'Cuban Peso', rate: 24.00, country: 'cu' },
  AWG: { symbol: 'Afl', name: 'Aruban Florin', rate: 1.79, country: 'aw' },
  
  // Oceania
  FJD: { symbol: 'FJ$', name: 'Fijian Dollar', rate: 2.24, country: 'fj' },
  PGK: { symbol: 'K', name: 'Papua New Guinean Kina', rate: 3.73, country: 'pg' },
  WST: { symbol: 'WS$', name: 'Samoan Tala', rate: 2.72, country: 'ws' },
  TOP: { symbol: 'T$', name: 'Tongan Paanga', rate: 2.36, country: 'to' },
  VUV: { symbol: 'VT', name: 'Vanuatu Vatu', rate: 119.50, country: 'vu' },
  SBD: { symbol: 'SI$', name: 'Solomon Islands Dollar', rate: 8.45, country: 'sb' },
  
  // Crypto
  BTC: { symbol: 'BTC', name: 'Bitcoin', rate: 0.000021, country: 'btc' },
  ETH: { symbol: 'ETH', name: 'Ethereum', rate: 0.00036, country: 'eth' },
}

// Group currencies by region for better UX
const CURRENCY_GROUPS = {
  'Popular': ['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'INR', 'CAD', 'AUD', 'CHF'],
  'Europe': ['EUR', 'GBP', 'CHF', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'RON', 'BGN', 'RUB', 'UAH', 'TRY', 'ISK'],
  'Asia Pacific': ['JPY', 'CNY', 'INR', 'HKD', 'SGD', 'KRW', 'TWD', 'THB', 'MYR', 'IDR', 'PHP', 'VND', 'PKR', 'BDT'],
  'Middle East': ['AED', 'SAR', 'QAR', 'KWD', 'BHD', 'OMR', 'ILS', 'JOD', 'LBP', 'TRY', 'IRR'],
  'Africa': ['ZAR', 'EGP', 'NGN', 'KES', 'GHS', 'MAD', 'TND', 'DZD', 'ETB', 'XOF'],
  'Americas': ['USD', 'CAD', 'MXN', 'BRL', 'ARS', 'CLP', 'COP', 'PEN', 'DOP', 'JMD'],
  'Oceania': ['AUD', 'NZD', 'FJD', 'PGK'],
  'Crypto': ['BTC', 'ETH'],
}

const CurrencyContext = createContext()

export function CurrencyProvider({ children }) {
  const [currency, setCurrency] = useState('USD')
  const [rates, setRates] = useState(CURRENCIES)
  const [loading, setLoading] = useState(false)

  // Fetch live rates on mount (optional - uses static rates as fallback)
  useEffect(() => {
    const fetchRates = async () => {
      try {
        setLoading(true)
        // Using free exchangerate-api
        const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD')
        if (res.ok) {
          const data = await res.json()
          // Merge live rates with our currency data
          const updatedRates = { ...CURRENCIES }
          Object.keys(data.rates).forEach(code => {
            if (updatedRates[code]) {
              updatedRates[code] = { ...updatedRates[code], rate: data.rates[code] }
            }
          })
          setRates(updatedRates)
        }
      } catch (err) {
        console.log('Using static exchange rates')
      } finally {
        setLoading(false)
      }
    }
    fetchRates()
  }, [])

  // Convert USD to selected currency
  const convert = useCallback((amountUSD) => {
    if (!rates[currency]) return amountUSD
    return amountUSD * rates[currency].rate
  }, [currency, rates])

  // Convert selected currency to USD (inverse)
  const convertToUSD = useCallback((amountInCurrency) => {
    if (!rates[currency]) return amountInCurrency
    return amountInCurrency / rates[currency].rate
  }, [currency, rates])

  // Format currency with symbol
  const format = useCallback((amountUSD, options = {}) => {
    const { decimals = 2, showSymbol = true, compact = false } = options
    const converted = convert(amountUSD)
    const currencyData = rates[currency] || rates.USD
    
    let formatted
    if (compact && Math.abs(converted) >= 1000000) {
      formatted = (converted / 1000000).toFixed(1) + 'M'
    } else if (compact && Math.abs(converted) >= 1000) {
      formatted = (converted / 1000).toFixed(1) + 'K'
    } else {
      formatted = converted.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })
    }
    
    return showSymbol ? `${currencyData.symbol}${formatted}` : formatted
  }, [convert, currency, rates])

  // Get currency info
  const getCurrencyInfo = useCallback(() => {
    return rates[currency] || rates.USD
  }, [currency, rates])

  const value = {
    currency,
    setCurrency,
    rates,
    convert,
    convertToUSD,
    format,
    getCurrencyInfo,
    loading,
    currencyGroups: CURRENCY_GROUPS,
    allCurrencies: Object.keys(rates),
  }

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider')
  }
  return context
}

export default CurrencyContext
