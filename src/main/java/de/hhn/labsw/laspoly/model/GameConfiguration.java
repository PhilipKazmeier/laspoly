package de.hhn.labsw.laspoly.model;
/**
 * Constants used during a {@link GameConfiguration}.
 */
public final class GameConfiguration {

    /**
     * Private constructor to prevent initialization.
     */
    private GameConfiguration() {
    }

    /**
     * Maximum number of {@link de.hhn.labsw.laspoly.model.field.Field}.
     */
    public static final int MAX_FIELDS = 41;
    /**
     * Maximum number of {@link de.hhn.labsw.laspoly.model.Player} allowed in a {@link
     * GameConfiguration}.
     */
    public static final int MAX_PLAYERS = 4;

    /**
     * Constant prices and amounts of money used during a {@link de.hhn.labsw.laspoly.model.Game}. Prices and
     * amounts are in Euro.
     */
    public static final class Money {
        /**
         * Base price for a {@link de.hhn.labsw.laspoly.model.building.House}.
         */
        public static final int BASE_PRICE_HOUSE = 50;
        /**
         * Price for traveling from one {@link de.hhn.labsw.laspoly.model.field.TrainStation} to an other.
         */
        public static final int PRICE_TRAIN_STATION_TRAVEL = 200;
        /**
         * The amount of money a {@link de.hhn.labsw.laspoly.model.Player} gets on start of a {@link
         * de.hhn.labsw.laspoly.model.Game}.
         */
        public static final int STARTING_MONEY_AMOUNT_PLAYER = 1300;
        /**
         * The amount of money a {@link de.hhn.labsw.laspoly.model.field.specialfield.Casino} gets on start of a
         * {@link de.hhn.labsw.laspoly.model.Game}.
         */
        public static final int STARTING_MONEY_AMOUNT_CASINO = 1300;
        /**
         * The amount of money that has to be paid if a {@link de.hhn.labsw.laspoly.model.Player} moves onto {@link
         * de.hhn.labsw.laspoly.model.field.specialfield.PayToCasinoField}.
         */
        public static final int PRICE_PAY_TO_CASINO = 100;
    }
}
