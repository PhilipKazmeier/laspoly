package de.hhn.labsw.laspoly.model.card;

import de.hhn.labsw.laspoly.view.paint.Drawable;
import javafx.scene.Node;
import javafx.scene.shape.Box;

/**
 * This class represents the base class for every card in a {@link de.hhn.labsw.laspoly.model.Game}.
 */
public abstract class Card implements Drawable {

    /**
     * Name of this card.
     */
    private String name;

    /**
     * Constructor.
     *
     * @param cardName Name of this card.
     */
    public Card (String cardName) {
        name = cardName;
    }

    /**
     * @return {@link #name}.
     */
    public String getName () {
        return name;
    }

    @Override
    public Node draw () {
        return new Box(10, 10, 10);
    }
}
