package de.hhn.labsw.laspoly.model.card;
import de.hhn.labsw.laspoly.GraphicsTest;
import de.hhn.labsw.laspoly.model.field.Attraction;
import de.hhn.labsw.laspoly.model.field.Property;
import de.hhn.labsw.laspoly.model.field.TrainStation;
import static org.hamcrest.CoreMatchers.is;
import static org.hamcrest.MatcherAssert.assertThat;
import org.junit.experimental.theories.DataPoints;
import org.junit.experimental.theories.Theories;
import org.junit.experimental.theories.Theory;
import org.junit.runner.RunWith;

/**
 * This test class tests {@link de.hhn.labsw.laspoly.model.card.PropertyCard}.
 */
@RunWith(Theories.class)
public class PropertyCardTest extends GraphicsTest {
    @DataPoints
    public static String[] names = {"Name1", "Name2", "Name3", "Name4", "Name5"};
    @DataPoints
    public static int[] pos = {0, 5, 21, 4, 7};
    @DataPoints
    public static boolean[] bool = {true,false};

    @Theory
    public void testConstructor(final String name, final int pos, final boolean c) {
        Property property;
        if (c) {
            property = new Attraction(pos, name);
        } else {
            property = new TrainStation(pos, name);
        }
        PropertyCard card = new PropertyCard(property);
        assertThat(card.getName(), is(property.getName()));
        assertThat(card.getProperty(), is(property));
    }
}
