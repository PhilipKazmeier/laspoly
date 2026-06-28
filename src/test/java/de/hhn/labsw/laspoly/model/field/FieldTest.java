package de.hhn.labsw.laspoly.model.field;
import de.hhn.labsw.laspoly.model.field.specialfield.ActionField;
import de.hhn.labsw.laspoly.model.field.specialfield.FreeParkingField;
import de.hhn.labsw.laspoly.view.paint.DrawableTest;
import javafx.scene.paint.Color;
import org.junit.experimental.theories.DataPoints;
import org.junit.experimental.theories.Theories;
import org.junit.runner.RunWith;

@RunWith(Theories.class)
public class FieldTest extends DrawableTest {
    @DataPoints // drawables for super class DrawableTest
    public static Field[] fields = {
            new ActionField(0),
            new FreeParkingField(),
            new Street(0, "", Color.BLACK, 0, new int[0])
    };
}