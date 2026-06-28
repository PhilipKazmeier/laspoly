package de.hhn.labsw.laspoly.model.action;

import de.hhn.labsw.laspoly.model.Player;
import de.hhn.labsw.laspoly.model.User;
import de.hhn.labsw.laspoly.model.building.Building;
import de.hhn.labsw.laspoly.model.building.Factory;
import de.hhn.labsw.laspoly.model.building.Hotel;
import de.hhn.labsw.laspoly.model.building.House;
import de.hhn.labsw.laspoly.model.field.FieldConfiguration;
import de.hhn.labsw.laspoly.model.field.Street;
import org.junit.experimental.theories.DataPoints;

import java.util.Locale;

import static org.hamcrest.CoreMatchers.is;
import static org.junit.Assert.assertThat;
import static org.junit.Assert.assertTrue;
import static org.junit.Assume.assumeTrue;

/**
 * This class tests {@link de.hhn.labsw.laspoly.model.action.Build}.
 */
// @RunWith (Theories.class)
public class BuildTest {

    @DataPoints
    public static Player[] players = {new Player(new User("Name", Locale.GERMAN, 0)), new Player(new User("Philip",
            Locale.ENGLISH, 0)), new Player(new User("Brian", Locale.GERMAN, 0)), new Player(new User("Patrick",
            Locale.ENGLISH, 0))};

    @DataPoints
    public static Street[] streets = {new Street(0, "Name", FieldConfiguration.GROUP_COLOURS[0], 200, new int[]{0, 0,
            0, 0, 0})};

    @DataPoints
    public static Building[] buildings = {new House(), new Hotel(), new Factory()};

    // TODO Never found parameters that satisfied method assumptions. @Theory
    public void testIsActionValid(Player player, Street street, Building building) {
        Build build = new Build(player, street, building);
        if (building instanceof House) {
            assertThat(build.isActionValid(), is(street.canConstructHouse()));
        } else if (building instanceof Hotel) {
            assertThat(build.isActionValid(), is(street.canConstructHotel()));
        } else if (building instanceof Factory) {
            assertThat(build.isActionValid(), is(street.canConstructFactory()));
        }
    }


    // TODO Never found parameters that satisfied method assumptions.  @Theory
    public void testGetters(Player player, Street street, Building building) {
        Build build = new Build(player, street, building);
        assertThat(build.getBuilding(), is(building));
        assertThat(build.getPlayer(), is(player));
        assertThat(build.getStreet(), is(street));
    }

    // TODO Never found parameters that satisfied method assumptions.  @Theory
    public void testOnAction(Player player, Street street, Building building) {
        Build build = new Build(player, street, building);
        assumeTrue(build.isActionValid());
        build.onAction();
        assertTrue(street.getBuildings().contains(building));
    }
}
