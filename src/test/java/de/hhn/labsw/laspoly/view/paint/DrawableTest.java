package de.hhn.labsw.laspoly.view.paint;
import de.hhn.labsw.laspoly.GraphicsTest;
import static org.hamcrest.CoreMatchers.not;
import static org.hamcrest.CoreMatchers.nullValue;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.core.Is.is;
import org.junit.experimental.theories.Theory;

/**
 * Extend DrawableTest to assert that the draw method does not return null.
 * You must provide Drawable Datapoints.
 */
// no need to run this with theories.class because drawable classes should inherit DrawableTest
public class DrawableTest extends GraphicsTest{

    @Theory
    public void testDraw(Drawable drawable) throws Exception {
        assertThat(drawable.draw(),is( not(nullValue())));
    }
}