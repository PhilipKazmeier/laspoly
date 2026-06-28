package de.hhn.labsw.laspoly.model;

import de.hhn.labsw.laspoly.model.card.PropertyCard;
import de.hhn.labsw.laspoly.model.field.Attraction;
import de.hhn.labsw.laspoly.model.field.TrainStation;
import de.hhn.labsw.laspoly.view.paint.Material;
import org.junit.Before;
import org.junit.Test;
import org.junit.experimental.theories.DataPoints;
import org.junit.experimental.theories.Theories;
import org.junit.experimental.theories.Theory;
import org.junit.runner.RunWith;

import java.util.Locale;

import static org.hamcrest.CoreMatchers.is;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.junit.Assert.assertTrue;

/**
 * This test class tests {@link de.hhn.labsw.laspoly.model.Player}.
 */
@RunWith (Theories.class)
public class PlayerTest {

    private Player player;

    @DataPoints
    public static Figure[] figures() {
        Figure[] figures = new Figure[3];
        User user = new User("Test", Locale.GERMAN, 0);
        figures[0] = new Figure(user, Material.BLACK);
        figures[1] = new Figure(user, Material.GREEN);
        figures[2] = new Figure(user, Material.RED);
        return figures;
    }

    @DataPoints
    public static PropertyCard[] properties = {new PropertyCard(new TrainStation(0, "Name")), new PropertyCard(new
            Attraction(1, "Name2")), new PropertyCard(new TrainStation(2, "Name3")), new PropertyCard(new Attraction
            (3, "Name4")), new PropertyCard(new TrainStation(4, "Name5"))};


    @Before
    public void before() {
        player = new Player(new User("Test", Locale.GERMAN, 0));
    }

    @Test
    public void testGetCapital() {
        assertThat(player.getMoneyAmount(), is(GameConfiguration.Money.STARTING_MONEY_AMOUNT_PLAYER));
    }

    @Theory
    public void testChooseGetFigure(Figure figure) {
        player.chooseFigure(figure);
        assertThat(player.getFigure(), is(figure));
    }

    @Theory
    public void testAddGetPropterties(PropertyCard card) {
        player.getPropertyList().add(card);
        assertTrue(player.getPropertyList().contains(card));
    }

}
