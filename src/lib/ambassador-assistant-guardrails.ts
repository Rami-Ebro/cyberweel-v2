const commercialCommitmentPattern = /(?:[$€£¥]\s*[\d٠-٩]|[\d٠-٩][\d٠-٩.,٬٫\s]*\s*(?:usd|eur|gbp|sar|aed|دولار|يورو|ريال|درهم|ليرة)|(?:[\d٠-٩]+|a|an|one|two|three|four|five|six|seven|eight|nine|ten)\s+(?:business\s+)?(?:hours?|days?|weeks?|months?)\b|[\d٠-٩]+\s*(?:ساع(?:ة|ات)|أيام?|يوم|أسابيع?|أسبوع|أشهر|شهر)|(?:خلال|في غضون|يستغرق|المدة)\s+(?:ساعة|يوم|أسبوع|شهر)|\b(?:guaranteed?|we promise|will (?:increase|deliver|finish))\b|(?:نضمن|مضمون|نعدك|سننجز|سننتهي|سيزيد))/iu;

export function hasUnapprovedCommercialCommitment(answer: string) {
  return commercialCommitmentPattern.test(answer);
}
