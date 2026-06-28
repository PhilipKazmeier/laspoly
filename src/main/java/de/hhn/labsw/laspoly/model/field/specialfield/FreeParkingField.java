package de.hhn.labsw.laspoly.model.field.specialfield;

/**
 * Nothing happens if a {@link de.hhn.labsw.laspoly.model.Player} moves onto this gamescene.
 */
public class FreeParkingField extends SpecialField {
    public static final int POSITION = 10;

    /**
     * Creates a new Free parking field. The player who arrives here doesn't have to make any interactions.
     * This field is located in the front left corner.
     */
    public FreeParkingField () {
        super(POSITION);
    }
}
