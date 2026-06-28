package de.hhn.labsw.laspoly.model;

import de.hhn.labsw.laspoly.model.field.Attraction;
import de.hhn.labsw.laspoly.model.field.Field;
import de.hhn.labsw.laspoly.model.field.TrainStation;
import de.hhn.labsw.laspoly.view.paint.Drawable;
import de.hhn.labsw.laspoly.view.paint.DrawableTest;
import de.hhn.labsw.laspoly.view.paint.Material;
import org.junit.Before;
import org.junit.experimental.theories.DataPoints;
import org.junit.experimental.theories.Theories;
import org.junit.experimental.theories.Theory;
import org.junit.runner.RunWith;

import java.util.Locale;

import static org.hamcrest.CoreMatchers.is;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

/**
 * This test class tests {@link de.hhn.labsw.laspoly.model.Figure}.
 */
@RunWith (Theories.class)
public class FigureTest extends DrawableTest {


    @DataPoints
    public static Drawable[] drawables = {new Figure(new User("", Locale.ENGLISH, 0), Material.RED)};

    @DataPoints
    public static Figure[] figures = {new Figure(new User("", Locale.ENGLISH, 0), Material.RED), new Figure(new User("", Locale.GERMAN, 0), Material.BLACK), new Figure(new User("", Locale.ENGLISH, 0), Material.BLACK), new Figure(new User("", Locale.GERMAN, 0), Material.RED), new Figure(new User("", Locale.ENGLISH, 0), Material.RED)};

    @DataPoints
    public static Material[] materials = {Material.GREEN, Material.BLACK, Material.RED};

    @DataPoints
    public static User[] users = {new User("KingXY", Locale.GERMAN, 0), new User("Philip", Locale.GERMAN, 0), new User("Brian", Locale.GERMAN, 0), new User("Patrick", Locale.GERMAN, 0)};

    @DataPoints
    public static Field[] fields = {new TrainStation(0, ""), new Attraction(1, "")};

    private Figure figure;

    @Before
    public void before () {
        figure = new Figure(new User("", Locale.ENGLISH, 0), Material.RED);
    }

    @Theory
    public void testConstructorGetUser (User user) {
        Figure figure = new Figure(user, Material.BLACK);
        assertThat(figure.getUser(), is(user));
    }

    @Theory
    public void testPlaceFigure (Field field, Field field2, Figure figure2, Figure figure3, Figure figure4) {
        figure.placeFigure(field);
        assertTrue(field.getFigureList().contains(figure));
        figure2.placeFigure(field);
        assertTrue(field.getFigureList().contains(figure2));
        figure3.placeFigure(field);
        assertTrue(field.getFigureList().contains(figure3));
        figure4.placeFigure(field);
        assertTrue(field.getFigureList().contains(figure4));
        figure.placeFigure(field2);
        assertTrue(field2.getFigureList().contains(figure));
    }

    @Theory
    public void testGetFigure (Figure fig) {
        assertNotNull(fig.getFigure());
    }

    @Theory
    public void testGetText (User user) {
        Figure fig = new Figure(user, Material.BLACK);
        assertThat(fig.getText().getText(), is(user.getName()));
    }


}