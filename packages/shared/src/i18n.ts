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
  casinoEntered: "{player} ist im Casino — würfeln, um das Glück zu drehen!",
  casinoRoll: "{player} würfelt nochmal im Casino: {d1} und {d2}.",
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
  actionCardPay: "{card}: {player} zahlt {amount} LPD.",
  actionCardCollect: "{card}: {player} erhält {amount} LPD.",
  actionCardBroadcastPay: "{card}: {player} zahlt {amount} LPD an jeden Mitspieler.",
  actionCardBroadcastCollect: "{card}: {player} erhält {amount} LPD von jedem Mitspieler.",
  actionCardRepair: "{card}: {player} zahlt {amount} LPD für Reparaturen.",
  turnEnd: "{player} beendet seinen Zug.",
  swapProposed: "{from} bietet {to} einen Tausch an: gibt {giveProps} + {giveMoney} LPD, erhält {receiveProps} + {receiveMoney} LPD.",
  swapAccepted: "{to} nimmt das Tauschangebot von {from} an: {giveProps} + {giveMoney} LPD gegen {receiveProps} + {receiveMoney} LPD.",
  swapDeclined: "{to} lehnt das Tauschangebot von {from} ab.",
  swapFailed: "Tausch zwischen {from} und {to} ist fehlgeschlagen ({reason}).",
  surrendered: "{player} gibt auf.",
  specialEvent_circus: '🎪 Runde {round}: Der Zirkus ist in der Stadt! Attraktionsmieten sind diese Runde verdoppelt.',
  specialEvent_boom: '📈 Runde {round}: Wirtschaftsboom! Los-Auszahlungen sind diese Runde verdoppelt.',
  specialEvent_recession: '📉 Runde {round}: Rezession! Straßenmieten sind diese Runde halbiert.',
  specialEvent_jackpot: '🎰 Runde {round}: Casino-Jackpot-Nacht! Casinogewinne sind diese Runde 50 % höher.',
  specialEvent_buildingSale: '🏗️ Runde {round}: Bau-Rabatt! Gebäudekosten sind diese Runde halbiert.',
  specialEvent_quietDay: '😴 Runde {round}: Ruhiger Tag. Keine besonderen Ereignisse.',
  specialEvent_earthquake: '🌋 Runde {round}: Erdbeben! Jeder verliert ein Haus seiner am stärksten bebauten Straße und zahlt Reparaturen.',
  specialEvent_taxAudit: '🧾 Runde {round}: Steuerprüfung! Der reichste Spieler zahlt 10 % seines Bargelds in den Casino-Pool.',
  specialEvent_lottery: '🎟️ Runde {round}: Lotterie! Ein zufälliger Spieler gewinnt ein Viertel des Casino-Pools.',
  specialEvent_windfall: '💸 Runde {round}: Geldsegen! Alle Spieler erhalten Geld.',
  specialEvent_streetParty: '🎉 Runde {round}: Straßenfest in der Gruppe {group}! Mieten dort sind 2 Runden lang verdoppelt.',
  specialEvent_powerOutage: '🔌 Runde {round}: Stromausfall! Bahnhöfe kassieren diese Runde keine Miete.',
  specialEvent_marketCrash: '📉 Runde {round}: Marktcrash! Verkaufserlöse für Grundstücke sind 2 Runden lang halbiert.',
  specialEvent_goldRush: '⛏️ Runde {round}: Goldrausch! Fabrik-Einnahmen sind 2 Runden lang verdoppelt.',
  earthquakeDamage: '🌋 {player} verliert ein Haus auf {tile} und zahlt {fee} LPD Reparaturkosten.',
  taxAuditPaid: '🧾 {player} zahlt {amount} LPD Steuern in den Casino-Pool.',
  lotteryWin: '🎟️ {player} gewinnt {amount} LPD in der Lotterie!',
  windfallCollect: '💸 Alle Spieler erhalten {amount} LPD.',
  roundLimitReached: '🏁 Rundenlimit ({round}) erreicht! {player} gewinnt mit {worth} LPD Gesamtvermögen.',
  rentSkippedJail: '🔒 Keine Miete für {tile} — {owner} sitzt im Gefängnis (Hausregel).',
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
  casinoEntered: "{player} is at the casino — roll to spin your luck!",
  casinoRoll: "{player} rolls again at the casino: {d1} and {d2}.",
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
  actionCardPay: "{card}: {player} pays {amount} LPD.",
  actionCardCollect: "{card}: {player} collects {amount} LPD.",
  actionCardBroadcastPay: "{card}: {player} pays {amount} LPD to each other player.",
  actionCardBroadcastCollect: "{card}: {player} collects {amount} LPD from each other player.",
  actionCardRepair: "{card}: {player} pays {amount} LPD for repairs.",
  turnEnd: "{player} ends their turn.",
  swapProposed: "{from} offers {to} a swap: gives {giveProps} + {giveMoney} LPD, receives {receiveProps} + {receiveMoney} LPD.",
  swapAccepted: "{to} accepts {from}'s swap offer: {giveProps} + {giveMoney} LPD for {receiveProps} + {receiveMoney} LPD.",
  swapDeclined: "{to} declines {from}'s swap offer.",
  swapFailed: "Swap between {from} and {to} failed ({reason}).",
  surrendered: "{player} surrenders.",
  specialEvent_circus: '🎪 Round {round}: The circus is in town! Attraction rents are doubled this round.',
  specialEvent_boom: '📈 Round {round}: Economic boom! GO payouts are doubled this round.',
  specialEvent_recession: '📉 Round {round}: Recession! Street rents are halved this round.',
  specialEvent_jackpot: '🎰 Round {round}: Casino Jackpot Night! Casino winnings are 50% higher this round.',
  specialEvent_buildingSale: '🏗️ Round {round}: Building Sale! Construction costs are halved this round.',
  specialEvent_quietDay: '😴 Round {round}: Quiet Day. No special effects.',
  specialEvent_earthquake: '🌋 Round {round}: Earthquake! Everyone loses a house on their most-built street and pays repairs.',
  specialEvent_taxAudit: '🧾 Round {round}: Tax audit! The richest player pays 10% of their cash into the casino pool.',
  specialEvent_lottery: '🎟️ Round {round}: Lottery! A random player wins a quarter of the casino pool.',
  specialEvent_windfall: '💸 Round {round}: Windfall! All players receive money.',
  specialEvent_streetParty: '🎉 Round {round}: Street party in the {group} group! Rents there are doubled for 2 rounds.',
  specialEvent_powerOutage: '🔌 Round {round}: Power outage! Stations charge no rent this round.',
  specialEvent_marketCrash: '📉 Round {round}: Market crash! Property sale proceeds are halved for 2 rounds.',
  specialEvent_goldRush: '⛏️ Round {round}: Gold rush! Factory revenues are doubled for 2 rounds.',
  earthquakeDamage: '🌋 {player} loses a house on {tile} and pays {fee} LPD in repairs.',
  taxAuditPaid: '🧾 {player} pays {amount} LPD in taxes into the casino pool.',
  lotteryWin: '🎟️ {player} wins {amount} LPD in the lottery!',
  windfallCollect: '💸 All players receive {amount} LPD.',
  roundLimitReached: '🏁 Round limit ({round}) reached! {player} wins with a net worth of {worth} LPD.',
  rentSkippedJail: '🔒 No rent for {tile} — {owner} is in jail (house rule).',
};

const catalogues: Record<Locale, Catalogue> = { de, en };

// ---- action card names ----------------------------------------------------
// Friendly, localized names for every action card id (see engine ACTION_CARD_IDS).
// formatEvent substitutes these for the raw `card` param so announcements never
// surface internal ids like "move-random" or "gamblingTax".
const cardNamesDe: Catalogue = {
  "move-random": "Reise ins Glück",
  "move-to-GO": "Gehe auf LOS",
  "move-to-casino": "Ab ins Casino",
  "move-jail": "Ab ins Gefängnis",
  "move-forward": "Rücke vor",
  "move-next-station": "Zum nächsten Bahnhof",
  gamblingTax: "Glücksspielsteuer",
  parkingFine: "Parkstrafe",
  helicopterFlight: "Hubschrauberrundflug",
  magicianShow: "Zaubershow",
  independenceDay: "Unabhängigkeitstag",
  lookalikeCompetition: "Doppelgänger-Wettbewerb",
  yardSale: "Flohmarkt",
  inherit: "Erbschaft",
  horseRacing: "Pferderennen",
  slotMachine: "Spielautomat",
  roulette: "Roulette",
  boxingBet: "Boxwette",
  blackJack: "Black Jack",
  baccaratGame: "Baccarat",
  youGotPromoted: "Beförderung",
  birthday: "Geburtstag",
  pokerTable: "Pokertisch",
  factoryRedevelop: "Fabrik-Sanierung",
  generalRepairs: "Generalsanierung",
  streetRepairs: "Straßensanierung",
};

const cardNamesEn: Catalogue = {
  "move-random": "Lucky Trip",
  "move-to-GO": "Advance to GO",
  "move-to-casino": "Off to the Casino",
  "move-jail": "Go to Jail",
  "move-forward": "Advance",
  "move-next-station": "To the Next Station",
  gamblingTax: "Gambling Tax",
  parkingFine: "Parking Fine",
  helicopterFlight: "Helicopter Flight",
  magicianShow: "Magician Show",
  independenceDay: "Independence Day",
  lookalikeCompetition: "Lookalike Competition",
  yardSale: "Yard Sale",
  inherit: "Inheritance",
  horseRacing: "Horse Racing",
  slotMachine: "Slot Machine",
  roulette: "Roulette",
  boxingBet: "Boxing Bet",
  blackJack: "Black Jack",
  baccaratGame: "Baccarat",
  youGotPromoted: "Promotion",
  birthday: "Birthday",
  pokerTable: "Poker Table",
  factoryRedevelop: "Factory Redevelopment",
  generalRepairs: "General Repairs",
  streetRepairs: "Street Repairs",
};

const cardNames: Record<Locale, Catalogue> = { de: cardNamesDe, en: cardNamesEn };

export const ALL_EVENT_KEYS = Object.keys(de) as string[];
export const ALL_CARD_IDS = Object.keys(cardNamesDe) as string[];

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
  // Translate the raw card id (if any) to its friendly localized name so the
  // popup/log reads e.g. "Glücksspielsteuer" instead of "gamblingTax".
  let params = event.params;
  if (typeof params.card === "string") {
    const friendly = cardNames[locale][params.card];
    if (friendly !== undefined) params = { ...params, card: friendly };
  }
  return interpolate(template, params);
}
