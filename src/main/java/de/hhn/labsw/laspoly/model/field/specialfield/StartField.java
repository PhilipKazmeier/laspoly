package de.hhn.labsw.laspoly.model.field.specialfield;

/**
 * All {@link de.hhn.labsw.laspoly.model.Player} start the {@link de.hhn.labsw.laspoly.model.Game} on this gamescene.
 * Everytime a {@link de.hhn.labsw.laspoly.model.Player} passes this gamescene he/she will get a specific amount of money.
 * If he/she directly moves onto this gamescene he/she will get the double of the specific amount of money.
 */
public class StartField extends SpecialField {
    public static final int POSITION = 0;

    /**
     * Constructor.
     *
     */
    public StartField () {
        super(POSITION);
    }
}
