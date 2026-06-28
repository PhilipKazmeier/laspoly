package de.hhn.labsw.laspoly.model.card;

import de.hhn.labsw.laspoly.view.paint.Drawable;
import javafx.scene.Node;
import javafx.scene.shape.Box;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

/**
 * This class contains all {@link de.hhn.labsw.laspoly.model.card.ActionCard}. {@link de.hhn.labsw.laspoly.model.Player}
 * draw {@link de.hhn.labsw.laspoly.model.card.ActionCard} from this class.
 */
public class CardDeck implements Drawable {

    /**
     * List of all {@link de.hhn.labsw.laspoly.model.card.ActionCard} this deck contains.
     */
    private List<ActionCard> cards;

    /**
     * Constructor.
     */
    public CardDeck () {
        cards = new ArrayList<>();
    }

    /**
     * Adds a {@link de.hhn.labsw.laspoly.model.card.ActionCard} to {@link #cards}.
     *
     * @param card {@link de.hhn.labsw.laspoly.model.card.ActionCard} that is added.
     */
    public void add (ActionCard card) {
        cards.add(card);
    }

    /**
     * Removes a {@link de.hhn.labsw.laspoly.model.card.ActionCard} from {@link #cards}.
     *
     * @param card {@link de.hhn.labsw.laspoly.model.card.ActionCard} that is removed.
     */
    public void remove (ActionCard card) {
        cards.remove(card);
    }

    /**
     * Adds all to {@link #cards}.
     *
     * @param cardCollection {@link java.util.Collection} of {@link de.hhn.labsw.laspoly.model.card.ActionCard}.
     */
    public void addAll (Collection<ActionCard> cardCollection) {
        cards.addAll(cardCollection);
    }

    /**
     * Draws a {@link de.hhn.labsw.laspoly.model.card.ActionCard} from the deck.
     *
     * @return {@link de.hhn.labsw.laspoly.model.card.ActionCard} that was drawed.
     */
    public ActionCard pullCard () {
        ActionCard card = cards.get((int) (Math.random() * cards.size()));
        cards.remove(card);
        return card;
    }

    /**
     * @return {@link #cards}.
     */
    public List<ActionCard> getCards () {
        return cards;
    }

    @Override
    public Node draw () {
        return new Box(10, 10, 10);
    }
}
