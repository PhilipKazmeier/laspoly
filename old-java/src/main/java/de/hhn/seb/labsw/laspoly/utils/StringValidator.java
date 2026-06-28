/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.utils;

public final class StringValidator {
    private static final String[] BLACKLIST = new String[]{"arsch", "abschaum", "abart", "arschloch", "ahole", "biatch", "bitch", "blowjob", "buttface", "busen", "bukkake", "bremsspur", "browntown", "brueste", "brust", "breasts", "boner", "cock", "cokaine", "cunt", "defloration", "ficker", "Afterlecker", "Vagina", "anal", "hackfresse", "kackfass", "pimmel", "penis", "hure", "hoden", "fettgondel", "fick", "dick", "fuck", "fottze", "fotz\u00e4h", "f\u00f6tzchen", "fotze", "f\u00f6tze", "fotz", "fotzn", "gangbang", "mistfink", "mistkruecke", "mofo", "m\u00f6hse"};

    private StringValidator() {
    }

    public static boolean checkString(String word) {
        if (word == null) {
            return false;
        }
        for (String blackWord : BLACKLIST) {
            if (!word.toLowerCase().contains(blackWord.toLowerCase())) continue;
            return false;
        }
        return word.length() > 0 && word.replace(" ", "").matches("[a-zA-Z0-9\u00c4\u00d6\u00dc\u00e4\u00f6\u00fc\u00df]+");
    }

    public static boolean isAllowed(String word) {
        if (word == null) {
            return true;
        }
        for (String blackWord : BLACKLIST) {
            if (!word.toLowerCase().contains(blackWord.toLowerCase())) continue;
            return false;
        }
        return true;
    }
}

