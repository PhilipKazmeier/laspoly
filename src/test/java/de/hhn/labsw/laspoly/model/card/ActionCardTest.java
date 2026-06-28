package de.hhn.labsw.laspoly.model.card;

import static org.hamcrest.CoreMatchers.is;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.junit.Assert.assertNotNull;
import org.junit.Test;
import org.junit.experimental.theories.DataPoints;
import org.junit.experimental.theories.Theories;
import org.junit.experimental.theories.Theory;
import org.junit.runner.RunWith;

/**
 * This test class tests {@link de.hhn.labsw.laspoly.model.card.ActionCard}.
 */
@RunWith (Theories.class)
public class ActionCardTest{

    @DataPoints
    public static String[] names = {"Action", "ActionCard", "Card", "Do stuff", "Stuff happens"};

    @Theory
    public void testConstructor (String name) {
        ActionCard card = new ActionCard(name);
        assertThat(card.getName(), is(name));
    }

    @Test
    public void testDraw () {
        ActionCard card = new ActionCard("Test");
        assertNotNull(card.draw());
    }
}
