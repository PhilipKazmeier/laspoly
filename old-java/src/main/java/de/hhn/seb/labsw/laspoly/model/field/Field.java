/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javafx.collections.FXCollections
 *  javafx.collections.ObservableList
 *  javafx.scene.Cursor
 *  javafx.scene.Group
 *  javafx.scene.Node
 *  javafx.scene.control.ContextMenu
 *  javafx.scene.control.MenuItem
 *  javafx.scene.paint.Material
 *  javafx.scene.paint.PhongMaterial
 *  javafx.scene.shape.Box
 */
package de.hhn.seb.labsw.laspoly.model.field;

import de.hhn.seb.labsw.laspoly.model.card.Card;
import de.hhn.seb.labsw.laspoly.model.card.preview.ActionMenuDrawable;
import de.hhn.seb.labsw.laspoly.model.card.preview.ActionMenuProvider;
import de.hhn.seb.labsw.laspoly.model.figure.Figure;
import de.hhn.seb.labsw.laspoly.utils.EnhancedGroup;
import de.hhn.seb.labsw.laspoly.view.View;
import de.hhn.seb.labsw.laspoly.view.game.GameHandler;
import de.hhn.seb.labsw.laspoly.view.game.gamescene.PreviewManager;
import de.hhn.seb.labsw.laspoly.view.paint.AbsNodeHolder;
import de.hhn.seb.labsw.laspoly.view.paint.Drawable;
import java.util.List;
import java.util.function.Function;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.scene.Cursor;
import javafx.scene.Group;
import javafx.scene.Node;
import javafx.scene.control.ContextMenu;
import javafx.scene.control.MenuItem;
import javafx.scene.input.MouseEvent;
import javafx.scene.paint.Material;
import javafx.scene.paint.PhongMaterial;
import javafx.scene.shape.Box;

public abstract class Field
implements Drawable {
    public static final double HEIGHT = 10.0;
    public static final double WIDTH = 100.0;
    public static final double DEPTH = 150.0;
    private final int pos;
    private final NodeHolder nodes;
    private final ObservableList<Figure> figureList;
    private PhongMaterial material = View.Materials.FIELD_MATERIAL;
    private PhongMaterial materialHover = View.Materials.FIELD_MATERIAL_HOVER;

    public Field(int position) {
        this.pos = position;
        this.figureList = FXCollections.observableArrayList();
        this.nodes = new NodeHolder();
    }

    public abstract Card getPreviewCard();

    public abstract Card createNewPreviewCard();

    public abstract String getName();

    public int getPosition() {
        return this.pos;
    }

    public Group draw() {
        EnhancedGroup graphicsGroup = new EnhancedGroup();
        Box sep1 = new Box(1.0, 1.0, 150.0);
        Box sep2 = new Box(1.0, 1.0, 150.0);
        sep1.setTranslateX(-50.0);
        sep2.setTranslateX(50.0);
        sep1.setTranslateY(10.0);
        sep2.setTranslateY(10.0);
        sep1.setMaterial((Material)new de.hhn.seb.labsw.laspoly.view.paint.Material(View.GeneralColorResource.FIELD_COLOR.darker()));
        sep2.setMaterial((Material)new de.hhn.seb.labsw.laspoly.view.paint.Material(View.GeneralColorResource.FIELD_COLOR.darker()));
        graphicsGroup.getChildren().addAll(new Node[]{this.nodes.baseShape, sep1, sep2});
        return graphicsGroup;
    }

    protected void onHoverStart() {
        this.nodes.baseShape.setMaterial((Material)this.materialHover);
    }

    protected void onHoverEnd() {
        this.nodes.baseShape.setMaterial((Material)this.material);
    }

    protected final void registerMouseCallbacks(Node partOfField) {
        partOfField.setCursor(Cursor.HAND);
        partOfField.setOnMouseReleased(e -> {
            if (e.isPopupTrigger()) {
                this.showContextMenu(e);
            } else {
                PreviewManager.showPreview(this.getPreviewCard(), e.getScreenX(), e.getScreenY());
            }
        });
        partOfField.setOnMousePressed(e -> {
            if (e.isPopupTrigger()) {
                this.showContextMenu(e);
            }
        });
        partOfField.setOnMouseEntered(e -> this.onHoverStart());
        partOfField.setOnMouseExited(e -> this.onHoverEnd());
    }

    public final List<Figure> getFigureList() {
        return this.figureList;
    }

    public abstract void onFigureEntered(Figure var1, GameHandler var2);

    public double getWidth() {
        return 100.0;
    }

    public void setMaterials(PhongMaterial baseMaterial, PhongMaterial hoverMaterial) {
        this.material = baseMaterial;
        this.materialHover = hoverMaterial;
        this.nodes.baseShape.setMaterial((Material)this.material);
    }

    protected NodeHolder getNodes() {
        return this.nodes;
    }

    public int getRow() {
        if (this.pos == 40) {
            return 0;
        }
        if (this.pos < 10) {
            return 0;
        }
        if (this.pos < 20) {
            return 1;
        }
        if (this.pos < 30) {
            return 2;
        }
        return 3;
    }

    private void showContextMenu(MouseEvent event) {
        Card previewCard = this.getPreviewCard();
        if (!(previewCard instanceof ActionMenuDrawable)) {
            return;
        }
        ActionMenuDrawable menuDrawable = (ActionMenuDrawable)(previewCard);
        Function<ActionMenuDrawable, ActionMenuProvider> mbcf = PreviewManager.getMenuButtonCreationFunction();
        ActionMenuProvider menuProvider = mbcf.apply(menuDrawable);
        if (!menuProvider.isActionMenuVisible()) {
            return;
        }
        ContextMenu popup = new ContextMenu(menuProvider.getMenuItems().toArray(new MenuItem[1]));
        popup.show((Node)this.nodes.baseShape, event.getScreenX(), event.getScreenY());
    }

    public String toString() {
        return this.getClass().getName() + "{" + "pos=" + this.pos + ", nodes=" + this.nodes + ", figureList=" + this.figureList + ", material=" + this.material + ", materialHover=" + this.materialHover + '}';
    }

    public class NodeHolder
    implements AbsNodeHolder {
        private final Box baseShape = this.createBaseShape();

        protected NodeHolder() {
        }

        protected Box createBaseShape() {
            Box box = new Box(Field.this.getWidth(), 10.0, 150.0);
            box.setMaterial((Material)Field.this.material);
            box.setTranslateY(this.getBottomHeight() + 5.0);
            box.setOnMouseEntered(e -> Field.this.onHoverStart());
            box.setOnMouseExited(e -> Field.this.onHoverEnd());
            return box;
        }

        @Override
        public double getBottomHeight() {
            return 0.0;
        }

        public Box getBaseShape() {
            return this.baseShape;
        }

        public String toString() {
            return this.getClass().getName() + "{" + "baseShape=" + this.baseShape + '}';
        }
    }
}

