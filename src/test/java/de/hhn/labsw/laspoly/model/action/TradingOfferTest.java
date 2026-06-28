package de.hhn.labsw.laspoly.model.action;

import de.hhn.labsw.laspoly.GraphicsTest;
import de.hhn.labsw.laspoly.model.Player;
import de.hhn.labsw.laspoly.model.User;
import de.hhn.labsw.laspoly.model.card.PropertyCard;
import de.hhn.labsw.laspoly.model.field.Attraction;
import de.hhn.labsw.laspoly.model.field.TrainStation;
import org.junit.Before;
import org.junit.experimental.theories.DataPoints;
import org.junit.experimental.theories.Theories;
import org.junit.experimental.theories.Theory;
import org.junit.runner.RunWith;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import static org.hamcrest.CoreMatchers.is;
import static org.junit.Assert.assertThat;

/**
 * This test class tests {@link de.hhn.labsw.laspoly.model.action.TradingOffer}.
 */
@RunWith (Theories.class)
public class TradingOfferTest extends GraphicsTest {

    public static User[] users = {new User("KingXY", Locale.GERMAN,0), new User("Philip", Locale.GERMAN,0), new User("Brian", Locale.GERMAN,0), new User("Patrick", Locale.GERMAN,0)};

    @DataPoints
    public static Player[] players = {new Player(users[0]), new Player(users[1]), new Player(users[2]), new Player(users[3])};

    @DataPoints
    public static int[] moneyAmounts = {100, 350, 1000, 400, 200};

    @DataPoints
    public static PropertyCard[] properties = {new PropertyCard(new TrainStation(0, "Name")), new PropertyCard(new Attraction(1, "Name2")), new PropertyCard(new TrainStation(2, "Name3")), new PropertyCard(new Attraction(3, "Name4")), new PropertyCard(new TrainStation(4, "Name5"))};

    private TradingOffer offer;

    @Before
    public void before () {
        offer = new TradingOffer(players[0], players[1], null, null, 1000, 1000);
    }

    @Theory
    public void testSetGetOfferedMoney (int money) {
        offer.setOfferedMoney(money);
        assertThat(offer.getOfferedMoney(), is(money));
    }

    @Theory
    public void testSetGetDesiredMoney (int money) {
        offer.setDesiredMoney(money);
        assertThat(offer.getDesiredMoney(), is(money));
    }

    @Theory
    public void testGetSender (Player player) {
        TradingOffer offer = new TradingOffer(player, players[1], null, null, 1000, 1000);
        assertThat(offer.getSender(), is(player));
    }

    @Theory
    public void testGetReceiver (Player player) {
        TradingOffer offer = new TradingOffer(players[1], player, null, null, 1000, 1000);
        assertThat(offer.getReceiver(), is(player));
    }

    @Theory
    public void testSetGetOfferedCards (PropertyCard card) {
        List<PropertyCard> offeredCards = new ArrayList<>();
        offeredCards.add(card);
        offer.setOfferedCards(offeredCards);
        assertThat(offer.getOfferedCards(), is(offeredCards));
    }

    @Theory
    public void testSetGetDesiredCards (PropertyCard card) {
        List<PropertyCard> desiredCards = new ArrayList<>();
        desiredCards.add(card);
        offer.setDesiredCards(desiredCards);
        assertThat(offer.getDesiredCards(), is(desiredCards));
    }
}
