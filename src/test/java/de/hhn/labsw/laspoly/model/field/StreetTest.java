package de.hhn.labsw.laspoly.model.field;
import de.hhn.labsw.laspoly.exception.BuildingConstructionException;
import de.hhn.labsw.laspoly.model.building.Building;
import de.hhn.labsw.laspoly.model.building.Factory;
import de.hhn.labsw.laspoly.model.building.Hotel;
import de.hhn.labsw.laspoly.model.building.House;
import de.hhn.labsw.laspoly.view.paint.DrawableTest;
import javafx.scene.paint.Color;
import static org.hamcrest.core.Is.is;
import static org.junit.Assert.assertThat;
import org.junit.Rule;
import org.junit.experimental.theories.DataPoint;
import org.junit.experimental.theories.DataPoints;
import org.junit.experimental.theories.Theories;
import org.junit.experimental.theories.Theory;
import org.junit.rules.ExpectedException;
import org.junit.runner.RunWith;

import java.util.List;

/**
 * This test class tests {@link de.hhn.labsw.laspoly.model.card.PropertyCard}.
 */
@RunWith(Theories.class)
public class StreetTest extends DrawableTest {

    @Rule
    public ExpectedException exceptionExpector = ExpectedException.none();

    @DataPoints
    public static Street[] streets() {
        Street[] streets = {
                new Street(0, "", Color.BLACK, 0, new int[]{}),
                new Street(0, "", Color.BLACK, 0, new int[]{}),
                new Street(0, "", Color.BLACK, 0, new int[]{}),
                new Street(0, "", Color.BLACK, 0, new int[]{}),
                new Street(0, "", Color.BLACK, 0, new int[]{}),
                new Street(0, "", Color.BLACK, 0, new int[]{}),
                new Street(0, "", Color.BLACK, 0, new int[]{}),
        };
        // streets[0] has no buildings
        // streets[1] has a house
        streets[1].construct(new House());
        // streets[2] has a factory
        streets[2].construct(new Factory());
        // streets[3] has a hotel
        streets[3].construct(new House());
        streets[3].construct(new House());
        streets[3].construct(new House());
        streets[3].construct(new House());
        streets[3].construct(new Hotel());
        // streets[4] has two houses
        streets[4].construct(new House());
        streets[4].construct(new House());
        // streets[5] has three houses
        streets[5].construct(new House());
        streets[5].construct(new House());
        streets[5].construct(new House());
        // streets[6] has four houses
        streets[6].construct(new House());
        streets[6].construct(new House());
        streets[6].construct(new House());
        streets[6].construct(new House());
        return streets;
    }

    @DataPoint // constructortest won't work with datapoint*S*
    public static Color colors = Color.BLACK;
    @DataPoints
    public static String[] names = {
            "Hans", "Martin"
    };
    @DataPoints
    public static int[] prices = {
            100
    };
    @DataPoints
    public static int[][] rents = {
            /* TODO: add rents when street has implemented this*/
            {}
    };

    @Theory
    public void testConstructor(final int fieldPos, final String name, final Color color, final int price, final int[] rents) throws Exception {
        Street newStreet = new Street(fieldPos, name, color, price, rents);
        assertThat(newStreet.getColor(), is(color));
        assertThat(newStreet.getName(), is(name));
        assertThat(newStreet.getPosition(), is(fieldPos));
        assertThat(newStreet.getFigureList().isEmpty(), is(true));
        assertThat(newStreet.getBuildings().isEmpty(), is(true));
    }

    @Theory
    public void testConstructHotel(Street street) throws Exception {
        List<Building> existingBuildings = street.getBuildings();
        boolean thereAreOnlyHouses = thereAreOnlyHouses(existingBuildings);
        if (existingBuildings.size() == 4 && thereAreOnlyHouses) {
            exceptionExpector = ExpectedException.none();
        } else {
            exceptionExpector.expect(BuildingConstructionException.class);
        }
        street.construct(new Hotel());
    }

    private boolean thereAreOnlyHouses(List<Building> existingBuildings) {
        boolean thereAreOnlyHouses = true;
        for (Building b : existingBuildings) {
            if (!(b instanceof House)) {
                thereAreOnlyHouses = false;
                break;
            }
        }
        return thereAreOnlyHouses;
    }

    @Theory
    public void testConstructHouse(Street street) throws Exception {
        List<Building> existingBuildings = street.getBuildings();
        boolean thereAreOnlyHouses = true;
        for (Building b : existingBuildings) {
            if (!(b instanceof House)) {
                thereAreOnlyHouses = false;
                break;
            }
        }
        if (existingBuildings.size() < 4 && thereAreOnlyHouses) {
            exceptionExpector = ExpectedException.none();
        } else {
            exceptionExpector.expect(BuildingConstructionException.class);
        }
        street.construct(new House());
    }

    @Theory
    public void testConstructFactory(Street street) throws Exception {
        if (street.getBuildings().size() == 0) {
            exceptionExpector = ExpectedException.none();
        } else {
            exceptionExpector.expect(BuildingConstructionException.class);
        }
        street.construct(new Factory());
    }

    @Theory
    public void testConstructExistingBuilding(Street street) throws Exception {
        if (street.getBuildings().size() != 0) {
            exceptionExpector.expect(IllegalArgumentException.class);
            Building exisitingBuilding = street.getBuildings().get(0);
            street.construct(exisitingBuilding);
        }
    }

    @Theory
    public void testCanConstructHouse(Street street) throws Exception {
        boolean hasLessThanFourBuildings = street.getBuildings().size() < 4;
        boolean thereAreOnlyHouses = thereAreOnlyHouses(street.getBuildings());
        assertThat(street.canConstructHouse(), is(hasLessThanFourBuildings && thereAreOnlyHouses));
    }

    @Theory
    public void testCanConstructHotel(Street street) throws Exception {
        boolean hasFourBuildings = street.getBuildings().size() == 4;
        boolean thereAreOnlyHouses = thereAreOnlyHouses(street.getBuildings());
        assertThat(street.canConstructHotel(), is(hasFourBuildings && thereAreOnlyHouses));
    }

    @Theory
    public void testCanConstructFactory(Street street) throws Exception {
        assertThat(street.canConstructFactory(), is(street.getBuildings().isEmpty()));
    }
}