package de.hhn.labsw.laspoly.model.card;

import javafx.scene.Node;

/**
 * This class is a special {@link de.hhn.labsw.laspoly.model.card.Card} called ActionCard that triggers different
 * actions when activated.
 */
public class ActionCard extends Card {

    /**
     * Constructor.
     *
     * @param cardName Name of this card.
     */
    public ActionCard (String cardName) {
        super(cardName);
    }

    @Override
    public Node draw () {
        return super.draw();
    }
}
