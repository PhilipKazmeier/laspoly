package de.hhn.labsw.laspoly.model.field;

import de.hhn.labsw.laspoly.utils.Xform;
import de.hhn.labsw.laspoly.view.View;
import javafx.scene.CacheHint;
import javafx.scene.Group;
import javafx.scene.paint.Color;
import javafx.scene.text.Font;
import javafx.scene.text.Text;
import javafx.scene.text.TextAlignment;

/**
 * This class represents a {@link Field} that enables buying ad owning by the {@link de.hhn.labsw.laspoly.model.Player}.
 * If an other {@link de.hhn.labsw.laspoly.model.Player} gets on this gamescene when its bought by someone the {@link
 * de.hhn.labsw.laspoly.model.Player} has to pay a price called rent.
 */
public abstract class Property extends Field {
    /**
     * {@link javafx.scene.text.Font} of the {@link javafx.scene.text.Text} displayed on this {@link
     * de.hhn.labsw.laspoly.model.field.Property}.
     */
    public static final Font FONT_NAME = View.Fonts.fieldFont(View.Fonts.FIELD_NAME_SIZE);
    /**
     * Name of this {@link de.hhn.labsw.laspoly.model.field.Property}.
     */
    private String name;
    protected final NodeHolder nodes;

    /**
     * Constructor
     *
     * @param pos          Position of this {@link de.hhn.labsw.laspoly.model.field.Field}.
     * @param propertyName Name of this {@link de.hhn.labsw.laspoly.model.field.Property}.
     */
    public Property(int pos, String propertyName) {
        super(pos);
        name = propertyName;
        nodes = new NodeHolder();
    }

    @Override
    public Group draw() {
        Group group = super.draw();
        group.getChildren().add(nodes.textGroup);
        return group;
    }

    @Override
    protected void onHoverStart() {
        super.onHoverStart();
        nodes.text.setFill(Color.RED);
    }

    @Override
    protected void onHoverEnd() {
        super.onHoverEnd();
        nodes.text.setFill(Color.BLACK);
    }

    /**
     * @return {@link #name}.
     */
    public String getName() {
        return name;
    }

    /**
     * This class manages the creation and storage of 3D Shapes.
     * Every shape that can be reused should be stored in here.
     * The Shapes have to be created only once and on redraw,
     * it is sufficient to change only the shape properties that have changed
     */
    public class NodeHolder extends Field.NodeHolder {
        /**
         * 3D text (name) being displayed on the gamescene
         */
        final Text text;
        public Xform textGroup;

        /**
         * Creates all shapes and gives them their default configuration.
         */
        public NodeHolder() {
            text = new Text(name);
            text.setFont(FONT_NAME);
            text.setTextAlignment(TextAlignment.CENTER);
            text.setCacheHint(CacheHint.SCALE_AND_ROTATE);
            textGroup = new Xform(Xform.RotateOrder.YXZ);
            textGroup.getChildren().add(text);
            textGroup.setRotate(270, 90, 270);
            textGroup.setTranslateY(getBottomHeight() + 1);
            double margin = (Field.WIDTH - text.getBoundsInLocal().getWidth()) / 2.0;
            textGroup.setTranslateX(margin);
            textGroup.setOnMouseEntered(e -> onHoverStart());
            textGroup.setOnMouseExited(e -> onHoverEnd());
        }

        @Override
        public double getBottomHeight() {
            return super.getBottomHeight()+Field.HEIGHT;
        }
    }
}
