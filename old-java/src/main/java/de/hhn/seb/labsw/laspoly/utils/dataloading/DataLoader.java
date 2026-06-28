/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javafx.scene.image.Image
 *  javafx.scene.paint.Color
 *  javafx.scene.shape.MeshView
 */
package de.hhn.seb.labsw.laspoly.utils.dataloading;

import com.interactivemesh.jfx.importer.obj.ObjModelImporter;
import de.hhn.seb.labsw.laspoly.exception.InvalidParameterException;
import de.hhn.seb.labsw.laspoly.utils.EnhancedGroup;
import de.hhn.seb.labsw.laspoly.utils.ThreadRunner;
import de.hhn.seb.labsw.laspoly.utils.audio.BackgroundMusic;
import de.hhn.seb.labsw.laspoly.utils.dataloading.FigureSource;
import de.hhn.seb.labsw.laspoly.utils.dataloading.FlagSource;
import de.hhn.seb.labsw.laspoly.utils.dataloading.GameImage;
import de.hhn.seb.labsw.laspoly.utils.dataloading.GameSceneModelSource;
import de.hhn.seb.labsw.laspoly.utils.dataloading.ResourceBundleSource;
import java.util.Collection;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.ResourceBundle;
import java.util.logging.Logger;
import javafx.scene.image.Image;
import javafx.scene.paint.Color;
import javafx.scene.shape.MeshView;

public final class DataLoader {
    private static final DataLoader INSTANCE = new DataLoader();
    private static boolean loaded;
    private final Map<GameImage, Image> gameSceneImages = new HashMap<GameImage, Image>();
    private final Map<GameSceneModelSource, EnhancedGroup> gameSceneForms = new HashMap<GameSceneModelSource, EnhancedGroup>();
    private final Map<FigureSource, EnhancedGroup> figuresForms = new HashMap<FigureSource, EnhancedGroup>();
    private final Map<FlagSource, Image> flags = new HashMap<FlagSource, Image>();
    private final Map<ResourceBundleSource, ResourceBundle> resourceBundles = new HashMap<ResourceBundleSource, ResourceBundle>();
    private final HashMap<String, Locale> availableLocales;
    private final HashMap<FigureSource, Color> figureColors;
    private final Logger logger = Logger.getAnonymousLogger();
    private Locale resourceBundleLocale;

    private DataLoader() {
        this.availableLocales = new HashMap();
        this.availableLocales.put("Deutsch", Locale.GERMAN);
        this.availableLocales.put("English", Locale.ENGLISH);
        this.figureColors = new HashMap();
        this.figureColors.put(FigureSource.CAR1, Color.BLACK);
        this.figureColors.put(FigureSource.CAR2, Color.GREEN);
        this.figureColors.put(FigureSource.CAR3, Color.YELLOW);
        this.figureColors.put(FigureSource.CAR4, Color.RED);
        this.figureColors.put(FigureSource.CAR5, Color.BLUE);
        this.figureColors.put(FigureSource.POLICE_CAR, Color.DEEPSKYBLUE);
        this.figureColors.put(FigureSource.YACHT, Color.ANTIQUEWHITE);
        this.figureColors.put(FigureSource.EIFFEL, Color.GRAY);
        this.figureColors.put(FigureSource.ElAINE, Color.HOTPINK);
        this.figureColors.put(FigureSource.PORL, Color.CHOCOLATE);
        this.figureColors.put(FigureSource.ED, Color.BROWN);
        this.figureColors.put(FigureSource.CIRCUS, Color.ORANGE);
    }

    /*
     * WARNING - Removed try catching itself - possible behaviour change.
     */
    public static DataLoader getInstance() {
        DataLoader dataLoader = INSTANCE;
        synchronized (dataLoader) {
            if (!loaded) {
                INSTANCE.load();
            }
        }
        return INSTANCE;
    }

    private void load() {
        this.logger.info("Resource loading started");
        ObjModelImporter importer = new ObjModelImporter();
        for (FigureSource source : FigureSource.values()) {
            importer.read(this.getClass().getResource(source.source()));
            MeshView[] meshs = importer.getImport();
            EnhancedGroup enhancedGroup = new EnhancedGroup(meshs);
            enhancedGroup.setRx(180.0);
            this.figuresForms.put(source, enhancedGroup);
        }
        this.logger.info("Figure forms loaded");
        ThreadRunner.run(() -> {
            for (GameSceneModelSource source : GameSceneModelSource.values()) {
                EnhancedGroup group = this.loadMeshView(source.source());
                this.gameSceneForms.put(source, group);
            }
            this.logger.info("Game scene models loaded");
        });
        ThreadRunner.run(() -> {
            BackgroundMusic.initializeMusic();
            this.logger.info("Music loaded");
        });
        ThreadRunner.run(() -> {
            BackgroundMusic.initializeShort();
            this.logger.info("Short music clips loaded");
        });
        for (GameImage source : GameImage.values()) {
            Image im = new Image(this.getClass().getResourceAsStream(source.source()));
            this.gameSceneImages.put(source, im);
        }
        this.logger.info("Game scene images loaded");
        for (FlagSource source : FlagSource.values()) {
            Image image = new Image(this.getClass().getResourceAsStream(source.source()));
            this.flags.put(source, image);
        }
        this.logger.info("Flags loaded");
        loaded = true;
        this.logger.info("Loading of resources finished");
    }

    private EnhancedGroup loadMeshView(String source) {
        ObjModelImporter importer2 = new ObjModelImporter();
        importer2.read(this.getClass().getResource(source));
        MeshView[] meshs = importer2.getImport();
        EnhancedGroup enhancedGroup = new EnhancedGroup(meshs);
        enhancedGroup.setRx(180.0);
        return enhancedGroup;
    }

    public void loadResourceBundles(Locale locale) {
        this.resourceBundleLocale = locale;
        this.resourceBundles.clear();
        for (ResourceBundleSource source : ResourceBundleSource.values()) {
            ResourceBundle bundle = ResourceBundle.getBundle(source.source(), locale);
            this.resourceBundles.put(source, bundle);
        }
        this.logger.info("Resource bundles loading finished");
    }

    public ResourceBundle getResourceBundle(ResourceBundleSource source, Locale locale) {
        if (source.equals(ResourceBundleSource.CHANGE_DIALOG)) {
            return ResourceBundle.getBundle(source.source(), locale);
        }
        if (this.resourceBundleLocale == null || !this.resourceBundleLocale.equals(locale)) {
            this.loadResourceBundles(locale);
        }
        if (this.resourceBundles.containsKey(source)) {
            return this.resourceBundles.get(source);
        }
        throw new NoSuchElementException();
    }

    public EnhancedGroup getFigureForm(FigureSource source) {
        if (this.figuresForms.containsKey(source)) {
            return this.figuresForms.get(source);
        }
        throw new NoSuchElementException("There is no figure for:" + source);
    }

    public Collection<EnhancedGroup> getFigureForms() {
        return this.figuresForms.values();
    }

    public EnhancedGroup getGameSceneForm(GameSceneModelSource src) {
        if (this.gameSceneForms.containsKey(src)) {
            return this.gameSceneForms.get(src);
        }
        throw new NoSuchElementException();
    }

    public EnhancedGroup importGameSceneForm(GameSceneModelSource src) {
        return this.loadMeshView(src.source());
    }

    public Image getGameImage(GameImage source) {
        if (this.gameSceneImages.containsKey(source)) {
            return this.gameSceneImages.get(source);
        }
        throw new NoSuchElementException();
    }

    public Image getFlagImage(Locale locale) {
        if (locale.equals(Locale.GERMANY) || locale.equals(Locale.GERMAN)) {
            return this.flags.get(FlagSource.GERMAN);
        }
        if (locale.equals(Locale.ENGLISH)) {
            return this.flags.get(FlagSource.USA);
        }
        throw new InvalidParameterException("Locale should be supported", "locale", locale);
    }

    public HashMap<String, Locale> getAvailableLocales() {
        return this.availableLocales;
    }

    public Color getFigureColor(FigureSource figureSource) {
        return this.figureColors.get(figureSource);
    }

    public void forceLoad() {
        INSTANCE.load();
    }
}

