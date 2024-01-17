import { logInfo, logWarn, logError } from '@interop-be-reports/commons'
import { randomUUID } from 'crypto'
import { sub } from 'date-fns'
import { json2csv as _json2csv } from 'json-2-csv'
import { Worker } from 'worker_threads'

export function getMonthsAgoDate(numMonths: number): Date {
  return sub(new Date(), { months: numMonths })
}

export function getVariationPercentage(current: number, total: number): number {
  return total === 0 ? 0 : Number(((current / total) * 100).toFixed(1))
}

/**
 * Returns the tenants considered onboarded, i.e. the tenants that have an onboardedAt date
 */
export function getOnboardedTenants<TTenants extends { onboardedAt?: Date | undefined }>(
  tenants: Array<TTenants>
): Array<TTenants & { onboardedAt: Date }> {
  const isOnboarded = (tenant: TTenants): tenant is TTenants & { onboardedAt: Date } => !!tenant.onboardedAt
  return tenants.filter(isOnboarded)
}

const cidJob = randomUUID()

export const log = {
  info: logInfo.bind(null, cidJob),
  warn: logWarn.bind(null, cidJob),
  error: logError.bind(null, cidJob),
}

export const timer = {
  timeStart: 0,
  start(): void {
    this.timeStart = performance.now()
  },
  stop(): number {
    const timeEnd = performance.now()
    return Number(((timeEnd - this.timeStart) / 1000).toFixed(2))
  },
}

export function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
}

export function toKebabCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)
}

export function json2csv(data: object[]): string {
  const csv = _json2csv(data, {
    unwindArrays: true,
  })

  const header = csv.split('\n')[0]
  const records = csv.split('\n').slice(1)

  // `unwindArrays` option will create a header with the full path of the field
  // e.g. "data.lastSixMonths.0.count" instead of "count".
  // We only want the last part of the path
  const newHeader = header
    .split(',')
    .map((field) => field.split('.').slice(-1)[0])
    .join(',')

  return [newHeader, ...records].join('\n')
}

export function splitArrayIntoChunks<T>(array: T[], chunkSize: number): T[][] {
  if (chunkSize <= 0) throw new Error(`Invalid chunk size: ${chunkSize}`)

  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize))
  }
  return chunks
}

/**
 * Converts a list of dates into a timeseries sequence data.
 * @param oldestDate The oldest date in the list, which will be used as the starting point for the timeseries
 * @param jump The jump between each data point
 * @param data The list of dates
 */
export function toTimeseriesSequenceData({
  oldestDate,
  jump,
  data,
}: {
  oldestDate: Date
  jump: Duration
  data: Array<Date>
}): Array<{ date: Date; count: number }> {
  let currentDate = new Date()
  let currentCount: number = data.length
  const timeseriesData: Array<{ date: Date; count: number }> = [{ date: currentDate, count: currentCount }]

  while (oldestDate < currentDate) {
    // Jump to the next date
    currentDate = sub(currentDate, jump)
    // Count the number of dates that are less than or equal to the current date, and add it to the timeseries data
    currentCount = data.filter((date) => date <= currentDate).length

    timeseriesData.push({ date: currentDate, count: currentCount })
  }
  // Reverse the timeseries data so that the oldest date is first
  return timeseriesData.reverse()
}

export function createWorker<T = unknown>(filename: string, workerData?: unknown): Promise<T> {
  return new Promise(function (resolve, reject) {
    const worker = new Worker(filename, { workerData })
    worker.on('message', (data) => {
      resolve(data)
    })
    worker.on('error', (msg) => {
      reject(`An error ocurred: ${msg}`)
    })
  })
}
