package de.hhn.labsw.laspoly.model.card;

import org.junit.Before;
import org.junit.Test;
import org.junit.experimental.theories.DataPoints;
import org.junit.experimental.theories.Theories;
import org.junit.experimental.theories.Theory;
import org.junit.runner.RunWith;

import java.util.ArrayList;
import java.util.List;

import static junit.framework.TestCase.assertFalse;
import static org.hamcrest.CoreMatchers.is;
import static org.junit.Assert.*;

/**
 * This test class tests {@link de.hhn.labsw.laspoly.model.card.CardDeck}.
 */
@RunWith (Theories.class)
public class CardDeckTest {

    private CardDeck deck;

    @DataPoints
    public static ActionCard[] cards = {new ActionCard("Name"), new ActionCard("Action"), new ActionCard("Booom")};

    @Before
    public void before () {
        deck = new CardDeck();
    }

    @Theory
    public void testAddCard (ActionCard card) {
        deck.add(card);
        assertTrue(deck.getCards().contains(card));
    }

    @Theory
    public void testRemoveCard (ActionCard card) {
        deck.add(card);
        deck.remove(card);
        assertFalse(deck.getCards().contains(card));
    }

    @Theory
    public void testPullCard (ActionCard card) {
        deck.add(card);
        assertThat(deck.pullCard(), is(card));
        assertFalse(deck.getCards().contains(card));
    }

    @Theory
    public void testAddAll (ActionCard card) {
        List<ActionCard> cardList = new ArrayList<>();
        cardList.add(card);
        deck.addAll(cardList);
        assertThat(deck.getCards(), is(cardList));
    }

    @Test
    public void testDraw () {
        assertNotNull(deck.draw());
    }


}
