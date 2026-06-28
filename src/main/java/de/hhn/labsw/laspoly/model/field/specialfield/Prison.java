package de.hhn.labsw.laspoly.model.field.specialfield;

/**
 * This class contains all {@link de.hhn.labsw.laspoly.model.Player} that were moved to the {@link
 * de.hhn.labsw.laspoly.model.field.specialfield.Prison}. If a {@link de.hhn.labsw.laspoly.model.Player} is in {@link
 * de.hhn.labsw.laspoly.model.field.specialfield.Prison} he/she has to wait for 3 rounds to be free again or pay a
 * specific amount of money.
 */
public class Prison extends SpecialField {

    /**
     * Creates a new prison.  The prison is located in the middle of the board.
     *
     * @param pos Position of this field.
     */
    public Prison (int pos) {
        super(pos);
    }
}
