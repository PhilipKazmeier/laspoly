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
  built: "{player} baut {building} auf {tile} für {amount} LPD.",
  soldBuilding: "{player} verkauft {building} auf {tile} für {amount} LPD.",
  mortgaged: "{player} verpfändet {tile} für {amount} LPD.",
  unmortgaged: "{player} löst {tile} für {amount} LPD aus.",
  soldProperty: "{player} verkauft {tile} für {amount} LPD an die Bank.",
  traveled: "{player} reist von Feld {from} nach {tile} für {cost} LPD.",
  actionCard: "{player} zieht Aktionskarte: {card}.",
  actionCardMove: "{player} wird zu {tile} bewegt.",
  actionCardMoveJail: "{player} geht ins Gefängnis (Aktionskarte).",
  actionCardMoveForward: "{player} rückt {steps} Felder vor.",
  actionCardNextStation: "{player} rückt zum nächsten Bahnhof vor.",
  actionCardPay: "{player} zahlt {amount} LPD ({card}).",
  actionCardCollect: "{player} erhält {amount} LPD ({card}).",
  actionCardBroadcastPay: "{player} zahlt {amount} LPD an jeden Mitspieler ({card}).",
  actionCardBroadcastCollect: "{player} erhält {amount} LPD von jedem Mitspieler ({card}).",
  actionCardRepair: "{player} zahlt {amount} LPD für Reparaturen ({card}).",
  swapProposed: "{from} bietet {to} einen Tausch an: gibt {giveProps} + {giveMoney} LPD, erhält {receiveProps} + {receiveMoney} LPD.",
  swapAccepted: "{to} nimmt das Tauschangebot von {from} an: {giveProps} + {giveMoney} LPD gegen {receiveProps} + {receiveMoney} LPD.",
  swapDeclined: "{to} lehnt das Tauschangebot von {from} ab.",
  swapFailed: "Tausch zwischen {from} und {to} ist fehlgeschlagen ({reason}).",
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
  built: "{player} builds a {building} on {tile} for {amount} LPD.",
  soldBuilding: "{player} sells a {building} on {tile} for {amount} LPD.",
  mortgaged: "{player} mortgages {tile} for {amount} LPD.",
  unmortgaged: "{player} unmortgages {tile} for {amount} LPD.",
  soldProperty: "{player} sells {tile} to the bank for {amount} LPD.",
  traveled: "{player} travels from space {from} to {tile} for {cost} LPD.",
  actionCard: "{player} draws action card: {card}.",
  actionCardMove: "{player} is moved to {tile}.",
  actionCardMoveJail: "{player} goes to jail (action card).",
  actionCardMoveForward: "{player} advances {steps} spaces.",
  actionCardNextStation: "{player} advances to the next station.",
  actionCardPay: "{player} pays {amount} LPD ({card}).",
  actionCardCollect: "{player} collects {amount} LPD ({card}).",
  actionCardBroadcastPay: "{player} pays {amount} LPD to each other player ({card}).",
  actionCardBroadcastCollect: "{player} collects {amount} LPD from each other player ({card}).",
  actionCardRepair: "{player} pays {amount} LPD for repairs ({card}).",
  swapProposed: "{from} offers {to} a swap: gives {giveProps} + {giveMoney} LPD, receives {receiveProps} + {receiveMoney} LPD.",
  swapAccepted: "{to} accepts {from}'s swap offer: {giveProps} + {giveMoney} LPD for {receiveProps} + {receiveMoney} LPD.",
  swapDeclined: "{to} declines {from}'s swap offer.",
  swapFailed: "Swap between {from} and {to} failed ({reason}).",
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
