package de.hhn.labsw.laspoly.model.card;

import de.hhn.labsw.laspoly.model.field.Property;
import javafx.scene.Node;

/**
 * This class is a special {@link de.hhn.labsw.laspoly.model.card.Card} called PropertyCard that represents a {@link
 * de.hhn.labsw.laspoly.model.field.Property} and is connected to it.
 */
public class PropertyCard extends Card {

    /**
     * {@link de.hhn.labsw.laspoly.model.field.Property} this card is representing.
     */
    private Property property;

    /**
     * Constructor.
     *
     * @param prop {@link de.hhn.labsw.laspoly.model.field.Property} this card is representing.
     */
    public PropertyCard (Property prop) {
        super(prop.getName());
        property = prop;
    }

    @Override
    public Node draw () {
        return super.draw();
    }

    /**
     * @return {@link #property}.
     */
    public Property getProperty () {
        return property;
    }
}
