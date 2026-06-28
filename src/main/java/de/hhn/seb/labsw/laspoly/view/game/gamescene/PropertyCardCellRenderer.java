/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javafx.scene.Node
 *  javafx.scene.control.ListCell
 *  javafx.scene.image.ImageView
 *  javafx.scene.layout.AnchorPane
 *  javafx.scene.layout.Pane
 *  javafx.scene.layout.StackPane
 */
package de.hhn.seb.labsw.laspoly.view.game.gamescene;

import de.hhn.seb.labsw.laspoly.model.card.ActionMenuCard;
import de.hhn.seb.labsw.laspoly.model.card.preview.ActionMenuProvider;
import de.hhn.seb.labsw.laspoly.model.field.Property;
import de.hhn.seb.labsw.laspoly.utils.EnhancedGroup;
import de.hhn.seb.labsw.laspoly.utils.dataloading.DataLoader;
import de.hhn.seb.labsw.laspoly.utils.dataloading.GameImage;
import de.hhn.seb.labsw.laspoly.view.game.gamescene.PreviewManager;
import java.util.List;
import javafx.scene.Node;
import javafx.scene.control.ListCell;
import javafx.scene.image.ImageView;
import javafx.scene.layout.AnchorPane;
import javafx.scene.layout.Pane;
import javafx.scene.layout.StackPane;

public class PropertyCardCellRenderer
extends ListCell<Property> {
    private final List<Property> selectedProperties;
    private boolean enabled = true;
    private boolean menuVisible = false;
    private boolean loadFromFile = true;

    public PropertyCardCellRenderer(List<Property> selectedPropList) {
        this.selectedProperties = selectedPropList;
    }

    public PropertyCardCellRenderer(List<Property> selectedPropList, boolean interactive, boolean actionMenuVisible) {
        this(selectedPropList);
        this.enabled = interactive;
        this.menuVisible = actionMenuVisible;
    }

    public void preventLoadingFromFile(boolean prevent) {
        this.loadFromFile = !prevent;
    }

    public void updateItem(Property item, boolean empty) {
        super.updateItem(item, empty);
        if (empty || item == null) {
            this.setText(null);
            this.setGraphic((Node)new Pane());
        } else {
            AnchorPane selector = new AnchorPane();
            ImageView imgSelector = new ImageView(DataLoader.getInstance().getGameImage(GameImage.IC_SELECTOR));
            imgSelector.setLayoutX(68.0);
            imgSelector.setLayoutY(118.0);
            selector.getChildren().addAll(new Node[]{imgSelector});
            selector.setStyle(" -fx-background-color: rgba(85, 85, 85, 0.22);");
            ActionMenuCard card = this.loadFromFile ? (ActionMenuCard)item.createNewPreviewCard() : (ActionMenuCard)item.getPreviewCard();
            ActionMenuProvider prov = PreviewManager.getMenuButtonCreationFunction().apply(card);
            card.getMenuButton().setVisible(this.menuVisible && prov.isActionMenuVisible());
            card.consumeMenuActions(prov.getMenuItems(), PreviewManager.getMenuButtonCreationFunction());
            EnhancedGroup previewCard = card.drawPreview();
            StackPane pane = new StackPane(new Node[]{previewCard, selector});
            pane.setOnMouseReleased(e -> {
                if (!this.enabled) {
                    return;
                }
                selector.setVisible(!selector.isVisible());
                if (selector.isVisible()) {
                    this.selectedProperties.add(item);
                } else {
                    this.selectedProperties.remove(item);
                }
            });
            selector.setVisible(this.enabled && this.selectedProperties.contains(item));
            this.setGraphic((Node)pane);
        }
    }
}

