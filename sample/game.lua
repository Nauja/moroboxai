WIDTH = 256;
HEIGHT = 256;

-- select tilemap.png as the tilemap
tmap('tilemap');
-- assign the tile 0 to sprite 0
stile(0, 0);
-- position sprite 0 at the center
spos(0, WIDTH / 2 - 8, HEIGHT / 2 - 8);

function tick(deltaTime)
    -- rotate sprite 0
    srot(0, deltaTime)
end
