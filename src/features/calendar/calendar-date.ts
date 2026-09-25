import { format, nextMonday, parseISO, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

export const SCHOOL_TIMEZONE = "America/Sao_Paulo";
export const civilDate = (date: Date) => format(date, "yyyy-MM-dd");
export const schoolToday = (instant: Date) => formatInTimeZone(instant, SCHOOL_TIMEZONE, "yyyy-MM-dd");
export const nextAssessmentMonday = (today: string) => civilDate(nextMonday(parseISO(today)));
export const longDate = (date: string) => format(parseISO(date), "EEEE, d 'de' MMMM", { locale: ptBR });
export const shortDate = (date: string) => format(parseISO(date), "dd/MM");
export const monthLabel = (date: Date) => format(date, "MMMM yyyy", { locale: ptBR });
export const defaultDeadline = (date: string) => fromZonedTime(`${civilDate(subDays(parseISO(date), 3))}T18:00:00`, SCHOOL_TIMEZONE).toISOString();
export const deadlineInput = (instant: string) => formatInTimeZone(instant, SCHOOL_TIMEZONE, "yyyy-MM-dd'T'HH:mm");
export const deadlineLabel = (instant: string) => formatInTimeZone(instant, SCHOOL_TIMEZONE, "dd/MM 'às' HH:mm");
export const schoolInstant = (localInput: string) => fromZonedTime(localInput, SCHOOL_TIMEZONE).toISOString();
