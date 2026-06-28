/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javafx.application.Platform
 */
package de.hhn.seb.labsw.laspoly.view.game.gamescene;

import de.hhn.seb.labsw.laspoly.model.card.preview.ActionMenuDrawable;
import de.hhn.seb.labsw.laspoly.model.card.preview.ActionMenuProvider;
import de.hhn.seb.labsw.laspoly.utils.EnhancedGroup;
import de.hhn.seb.labsw.laspoly.utils.ThreadRunner;
import de.hhn.seb.labsw.laspoly.view.paint.PreviewDrawable;
import java.util.ArrayList;
import java.util.List;
import java.util.function.Consumer;
import java.util.function.Function;
import javafx.application.Platform;

public final class PreviewManager {
    public static final int MOUSE_DISTANCE_THRESHOLD = 150;
    public static final double PREVIEW_OPACITY = 1.0;
    private static List<Consumer<EnhancedGroup>> listeners;
    private static PreviewDrawable lastPreview;
    private static Function<ActionMenuDrawable, ActionMenuProvider> menuButtonCreationFunction;
    private static double previewScreenX = -1.0;
    private static double previewScreenY = -1.0;

    private PreviewManager() {
    }

    public static Function<ActionMenuDrawable, ActionMenuProvider> getMenuButtonCreationFunction() {
        return menuButtonCreationFunction;
    }

    public static void setMenuButtonCreationFunction(Function<ActionMenuDrawable, ActionMenuProvider> menuCreationFunction) {
        menuButtonCreationFunction = menuCreationFunction;
    }

    public static void addPreviewListener(Consumer<EnhancedGroup> showPreviewConsumer) {
        if (listeners == null) {
            listeners = new ArrayList<Consumer<EnhancedGroup>>();
        }
        listeners.add(showPreviewConsumer);
    }

    public static void resetLastDrawable() {
        lastPreview = null;
    }

    public static void showPreview(PreviewDrawable previewDrawable) {
        PreviewManager.showPreview(previewDrawable, -1.0, -1.0);
    }

    public static void showPreview(PreviewDrawable previewDrawable, double screenX, double screenY) {
        previewScreenX = screenX;
        previewScreenY = screenY;
        if (listeners != null && PreviewManager.mayShow(previewDrawable)) {
            EnhancedGroup prevGroup = previewDrawable.drawPreview();
            Platform.runLater(() -> listeners.forEach(listener -> listener.accept(prevGroup)));
            lastPreview = previewDrawable;
            ThreadRunner.run(PreviewManager::resetLastDrawable, 4000L);
        }
        if (previewDrawable instanceof ActionMenuDrawable && menuButtonCreationFunction != null) {
            ActionMenuDrawable cons = (ActionMenuDrawable)previewDrawable;
            ActionMenuProvider prov = menuButtonCreationFunction.apply(cons);
            cons.getMenuButton().setVisible(prov.isActionMenuVisible());
            cons.consumeMenuActions(prov.getMenuItems(), menuButtonCreationFunction);
        }
    }

    public static void reset() {
        listeners.clear();
    }

    public static double getPreviewScreenX() {
        return previewScreenX;
    }

    public static double getPreviewScreenY() {
        return previewScreenY;
    }

    private static boolean mayShow(PreviewDrawable previewDrawable) {
        return previewDrawable != null && lastPreview != previewDrawable;
    }
}

