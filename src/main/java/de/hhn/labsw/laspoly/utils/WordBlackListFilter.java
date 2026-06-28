package de.hhn.labsw.laspoly.utils;
public class WordBlackListFilter {
    public Mode getMode() {
        return mode;
    }

    /**
     * The selected mode for this filter object.
     */
    private final Mode mode;

    /**
     * Enumeration specifies how strictly words are filtered.
     */
    public enum Mode {
        /**
         * Don't allow any black list words.
         */
        STRICT,
        /**
         * This is like a parent mode that allows more words than strict mode.
         */
        NORMAL
    }

    /**
     * Creates a new Filter applying the given mode.
     *
     * @param mode the mode
     */
    public WordBlackListFilter(Mode mode) {
        this.mode = mode;
    }

    /**
     * Checks a user name for disallowed words.
     *
     * @param name the user name
     * @return true if the given name only contains valid words and phrases, false otherwise.
     */
    public boolean isUserNameOK(final String name) {
        for (String blackWord : BlackList.userNameBlackList) {
            if (name.contains(blackWord)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Looks for disallowed phrases in a chat message
     *
     * @param message the user message
     * @return true if the given string only contains valid words and phrases, false otherwise.
     */
    public boolean isChatMsgOK(final String message) {
        // todo: check the selected mode
        for (String blackWord : BlackList.userNameBlackList) {
            if (message.contains(blackWord)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Class that holds black words.
     */
    private static class BlackList {
        /**
         * Array of disallowed user name terms.
         */
        public static String[] userNameBlackList = {
                "Arsch",
                // TODO add words to blacklist
        };
        /**
         * Array of disallowed chat terms.
         */
        public static String[] chatBlackList = {
                "Arsch",
                // TODO add words to blacklist
        };
    }
}
