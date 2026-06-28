import type { GameEvent } from "./types.js";

export type Locale = "de" | "en";

type Catalogue = Record<string, string>;

const de: Catalogue = {
  rolled: "{player} würfelt {d1} und {d2} (Summe: {sum}).",
  moved: "{player} bewegt sich auf {tile} (Feld {pos}).",
  goPassed: "{player} passiert LOS und kassiert {amount} LPD.",
  goLanded: "{player} landet auf LOS und kassiert {amount} LPD.",
  purchaseOffer: "{player} kann {tile} für {price} LPD kaufen.",
  bought: "{player} kauft {tile} für {price} LPD.",
  declined: "{player} verzichtet auf den Kauf von {tile}.",
  rentPaid: "{player} zahlt {amount} LPD Miete an {owner} für {tile}.",
  rentMortgaged: "{tile} ist verpfändet – keine Miete fällig.",
  factoryRevenue: "{player} kassiert {amount} LPD Fabrikeinnahmen von {tile}.",
  taxPaid: "{player} zahlt {amount} LPD Steuer.",
  casinoWin: "{player} gewinnt {amount} LPD im Casino!",
  casinoNoWin: "{player} hat kein Glück im Casino.",
  wentToJail: "{player} wandert für {turns} Runden ins Gefängnis.",
  tripleDoubles: "{player} würfelt zum dritten Mal in Folge Pasch und kommt ins Gefängnis.",
  jailRollFail: "{player} würfelt keinen Pasch – noch {turns} Runden im Gefängnis.",
  jailTimeServed: "{player} hat die Zeit abgesessen und zahlt {amount} LPD Lösegeld.",
  paidRansom: "{player} zahlt {amount} LPD Lösegeld und verlässt das Gefängnis.",
  leftJail: "{player} verlässt das Gefängnis und landet auf {tile}.",
  freeParking: "{player} parkt kostenlos – nichts passiert.",
  actionFieldNoop: "{player} landet auf einem Aktionsfeld (wird in Phase 2 aktiviert).",
  bankrupt: "{player} ist bankrott und scheidet aus dem Spiel aus.",
  gameOver: "Spiel beendet! {player} gewinnt!",
  nextTurn: "{player} ist an der Reihe.",
  extraRoll: "{player} darf nochmals würfeln (Pasch!).",
};

const en: Catalogue = {
  rolled: "{player} rolls {d1} and {d2} (total: {sum}).",
  moved: "{player} moves to {tile} (space {pos}).",
  goPassed: "{player} passes GO and collects {amount} LPD.",
  goLanded: "{player} lands on GO and collects {amount} LPD.",
  purchaseOffer: "{player} may purchase {tile} for {price} LPD.",
  bought: "{player} buys {tile} for {price} LPD.",
  declined: "{player} declines to buy {tile}.",
  rentPaid: "{player} pays {amount} LPD rent to {owner} for {tile}.",
  rentMortgaged: "{tile} is mortgaged – no rent due.",
  factoryRevenue: "{player} collects {amount} LPD factory revenue from {tile}.",
  taxPaid: "{player} pays {amount} LPD in tax.",
  casinoWin: "{player} wins {amount} LPD at the casino!",
  casinoNoWin: "{player} has no luck at the casino.",
  wentToJail: "{player} goes to jail for {turns} turns.",
  tripleDoubles: "{player} rolled doubles three times in a row and goes to jail.",
  jailRollFail: "{player} didn't roll doubles – {turns} turns left in jail.",
  jailTimeServed: "{player} has served their time and pays {amount} LPD bail.",
  paidRansom: "{player} pays {amount} LPD bail and leaves jail.",
  leftJail: "{player} leaves jail and lands on {tile}.",
  freeParking: "{player} parks for free – nothing happens.",
  actionFieldNoop: "{player} lands on an action space (activated in Phase 2).",
  bankrupt: "{player} is bankrupt and eliminated.",
  gameOver: "Game over! {player} wins!",
  nextTurn: "It's {player}'s turn.",
  extraRoll: "{player} rolls again (doubles!).",
};

const catalogues: Record<Locale, Catalogue> = { de, en };

export const ALL_EVENT_KEYS = Object.keys(de) as string[];

function interpolate(template: string, params: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const val = params[key];
    return val !== undefined ? String(val) : `{${key}}`;
  });
}

export function formatEvent(event: GameEvent, locale: Locale = "de"): string {
  const cat = catalogues[locale];
  const template = cat[event.key];
  if (!template) {
    return `[${event.key}] ${JSON.stringify(event.params)}`;
  }
  return interpolate(template, event.params);
}
