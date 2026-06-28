package de.hhn.labsw.laspoly.view.paint;
/**
 * This class manages the creation and storage of 3D Shapes.
 * Every shape that can be reused should be stored in here.
 * The Shapes have to be created only once and on redraw,
 * it is sufficient to change only the shape properties that have changed
 */
public abstract class AbsNodeHolder {
    /**
     * The base line is the offset between y = 0 and the y value on which the NodeHolder objects are built.
     * This means that every NodeHolder which draws shapes that are located on top of the x/z layer return {@code 0} because
     * their y translation is zero.
     *
     * @return the y offset
     */
    public abstract double getBottomHeight();

    @Override
    public String toString() {
        return "de.hhn.labsw.laspoly.view.paint.AbsNodeHolder{" + "bottomHeight=" + getBottomHeight() + '}';
    }
}
