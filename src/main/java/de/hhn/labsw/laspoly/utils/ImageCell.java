package de.hhn.labsw.laspoly.utils;

import javafx.scene.control.ListCell;
import javafx.scene.image.ImageView;

/**
 * ListCell for a ListView only containing ImageView items.
 */
public class ImageCell extends ListCell<ImageView> {

    @Override
    public void updateItem (ImageView item, boolean empty) {
        super.updateItem(item, empty);
        if (item != null) {
            setGraphic(item);
        }
    }
}