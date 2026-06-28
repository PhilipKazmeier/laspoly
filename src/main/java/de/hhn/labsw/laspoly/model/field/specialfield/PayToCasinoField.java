package de.hhn.labsw.laspoly.model.field.specialfield;
import de.hhn.labsw.laspoly.model.field.Field;

/**
 * If a {@link de.hhn.labsw.laspoly.model.Player} moves onto this gamescene he/she has to pay a specific amount of money to
 * the {@link de.hhn.labsw.laspoly.model.field.specialfield.Casino}.
 */
public class PayToCasinoField extends SpecialField {
    public static final int POSITION = 36;
    /**
     * Creates a Special Field and stores the position on the board.
     */
    public PayToCasinoField () {
        super(POSITION);
    }

    @Override
    public double getWidth() {
        return Field.WIDTH;
    }
}
