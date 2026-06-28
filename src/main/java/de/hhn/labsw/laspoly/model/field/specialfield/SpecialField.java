package de.hhn.labsw.laspoly.model.field.specialfield;

import de.hhn.labsw.laspoly.model.field.Field;
import de.hhn.labsw.laspoly.view.View;
import javafx.scene.Group;

/**
 * If a {@link de.hhn.labsw.laspoly.model.Player} moves onto a {@link de.hhn.labsw.laspoly.model.field.specialfield.SpecialField}
 * special actions will be triggered.
 * TODO make abstract
 */
public abstract class SpecialField extends Field {
    /**
     * Width of a SpecialField on the board.
     */
    public static final double WIDTH = 150;
    /**
     * @ see {@link #WIDTH}
     */
    public static final double HALF_WIDTH = WIDTH / 2.0;
    /**
     * Depth of a Field on the board.
     */
    public static final double DEPTH = WIDTH; // Original Monopoly ratio
    /**
     * @ see {@link #DEPTH}
     */
    public static final double HALF_DEPTH = HALF_WIDTH; // Original Monopoly ratio

    /**
     * Creates a Special Field and stores the position on the board.
     */
    protected SpecialField(int pos) {
        super(pos);
    }

    @Override
    public Group draw() {
        return new Group(nodes.baseShape);
    }

    @Override
    protected void onHoverEnd() {
        nodes.baseShape.setMaterial(View.Materials.FIELD_MATERIAL);
    }

    @Override
    protected void onHoverStart() {
        nodes.baseShape.setMaterial(View.Materials.FIELD_MATERIAL_HOVER);
    }

    @Override
    public double getWidth() {
        return SpecialField.WIDTH;
    }
}
