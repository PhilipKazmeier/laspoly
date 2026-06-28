package de.hhn.labsw.laspoly.model;

import org.junit.Before;
import org.junit.Test;
import org.junit.experimental.theories.DataPoints;
import org.junit.experimental.theories.Theories;
import org.junit.experimental.theories.Theory;
import org.junit.runner.RunWith;

import java.util.Locale;

import static org.hamcrest.CoreMatchers.is;
import static org.hamcrest.MatcherAssert.assertThat;

/**
 * This test class tests {@link de.hhn.labsw.laspoly.model.User}.
 */
@RunWith(Theories.class)
public class UserTest {
    private User user;
    @DataPoints
    public static String[] names = {"KingXY", "Philip", "Brian", "Maler", "Boss"};
    @DataPoints
    public static Integer[] ids = {1, 5, 234324, 233, 354};

    @Before
    public void before() {
        user = new User("Test", Locale.GERMAN, 0);
    }

    @Theory
    public void testSetGetName(String name) {
        user.setName(name);
        assertThat(user.getName(), is(name));
        // TODO assertThat(user.getNameProperty().getValue(), is(name));
    }

    @Theory
    public void testSetGetId(Integer id) {
        user.setId(id);
        assertThat(user.getId(), is(id));
    }

    @Test
    public void testToString() {
        String toString = "User{" +
                "name='" + user.getName() + '\'' +
                ", id=" + user.getId() +
                ", locale=" + user.getLocale() +
                ", imageID=" + user.getImageID() +
                '}';
        assertThat(user.toString(), is(toString));
    }
}
