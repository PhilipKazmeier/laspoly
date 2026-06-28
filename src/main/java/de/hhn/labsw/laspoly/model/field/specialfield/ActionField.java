package de.hhn.labsw.laspoly.model.field.specialfield;
import de.hhn.labsw.laspoly.model.field.Field;

/**
 * When a {@link de.hhn.labsw.laspoly.model.Player} moves onto this gamescene he/she draws a {@link
 * de.hhn.labsw.laspoly.model.card.ActionCard} from the {@link de.hhn.labsw.laspoly.model.card.CardDeck}.
 */
public class ActionField extends SpecialField {

    /**
     * Constructor
     *
     * @param pos Position of this field.
     */
    public ActionField(int pos) {
        super(pos);
    }

    @Override
    public double getWidth() {
        return Field.WIDTH;
    }

}
